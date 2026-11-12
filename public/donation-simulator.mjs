const maxDonors = 10000;
const amounts = [10, 25, 50, 100];
const largerAmounts = [1000, 5000, 10000, 25000];
const frequencies = [
  ['once', 'One-off', 1],
  ['monthly', 'Monthly', 12],
  ['quarterly', 'Quarterly', 4],
  ['annual', 'Annually', 1],
];
const starterDonors = { once: [12, 6, 2, 1], monthly: [4, 2, 1, 0], quarterly: [2, 1, 0, 0], annual: [0, 0, 1, 0] };
let nextGiftId = 1;
const draft = Object.fromEntries(frequencies.map(([key]) => [key, amounts.map((amount, index) => ({
  id: nextGiftId++, amount: String(amount), donors: String(starterDonors[key][index]),
}))]));
draft.bequest = [{ id: nextGiftId++, donors: '1', amount: '' }];
const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });
const count = new Intl.NumberFormat('en-AU');
const formatMoney = cents => cents == null ? '—' : money.format(cents / 100);

export function calculateDonationScenario(donors, amount, frequency = 'once') {
  if ([donors, amount].some(value => !['string', 'number'].includes(typeof value) || String(value).trim() === '')) return null;
  const contributions = frequencies.find(([key]) => key === frequency)?.[2];
  const donorCount = Number(donors);
  const amountCents = Math.round(Number(amount) * 100);
  if (!contributions || !Number.isInteger(donorCount) || donorCount < 0 || donorCount > maxDonors || Number(amount) < 0 || !Number.isSafeInteger(amountCents)) return null;
  const firstReceiptCents = donorCount * amountCents;
  const annualCents = firstReceiptCents * contributions;
  if (!Number.isSafeInteger(annualCents)) return null;
  return { donors: donorCount, amountCents, contributions, firstReceiptCents, annualCents };
}

function sumGifts(results, field) {
  const total = results.reduce((sum, result) => sum + (result?.[field] ?? 0), 0);
  return Number.isSafeInteger(total) ? total : null;
}

export function calculateDonationPlan(input = {}, largerInput = {}) {
  const baseGroups = Object.fromEntries(frequencies.map(([key]) => {
    const group = input[key];
    return [key, calculateDonationScenario(group?.donors, group?.amount, key)];
  }));
  const largerGifts = Object.fromEntries(frequencies.map(([key]) => [key, (largerInput[key] || []).map(gift => calculateDonationScenario(gift?.donors, gift?.amount, key))]));
  const groups = Object.fromEntries(frequencies.map(([key]) => {
    const base = baseGroups[key];
    const results = [base, ...(largerGifts[key] || [])];
    return [key, results.some(Boolean) ? { ...base, firstReceiptCents: sumGifts(results, 'firstReceiptCents'), annualCents: sumGifts(results, 'annualCents') } : null];
  }));
  const scenarios = [...Object.values(baseGroups), ...Object.values(largerGifts).flat()];
  const firstReceiptCents = sumGifts(scenarios, 'firstReceiptCents');
  const annualCents = sumGifts(scenarios, 'annualCents');
  return { groups, largerGifts, firstReceiptCents, annualCents, complete: firstReceiptCents !== null && annualCents !== null && scenarios.every(Boolean) };
}

export function calculateBequests(input = []) {
  const gifts = input.map(gift => calculateDonationScenario(gift?.donors, gift?.amount));
  const totalCents = sumGifts(gifts, 'firstReceiptCents');
  return { gifts, totalCents, complete: totalCents !== null && gifts.every(Boolean) };
}

function draftTotals() {
  const inputs = Object.fromEntries(Object.entries(draft).map(([key, gifts]) => [key, gifts.map(({ donors, amount, validAmount = true }) => {
    const validGift = validAmount ? amount : null;
    return { donors, amount: donors === '0' && validGift === '' ? '0' : validGift };
  })]));
  const bases = Object.fromEntries(frequencies.map(([key]) => [key, inputs[key][0]]));
  const extras = Object.fromEntries(frequencies.map(([key]) => [key, inputs[key].slice(1)]));
  const plan = calculateDonationPlan(bases, extras);
  const bequests = calculateBequests(inputs.bequest);
  const hasGifts = Object.values(plan.groups).some(Boolean);
  return {
    plan,
    firstReceiptCents: hasGifts ? plan.firstReceiptCents : null,
    annualCents: hasGifts ? plan.annualCents : null,
    bequestsCents: bequests.gifts.some(Boolean) ? bequests.totalCents : null,
  };
}

export function donationSnapshot() {
  const { plan, firstReceiptCents, annualCents, bequestsCents } = draftTotals();
  return { firstReceiptCents, annualCents, complete: plan.complete, bequestsCents };
}

function giftEditor(key, label, gift, e) {
  const bequest = key === 'bequest';
  const giftName = bequest ? 'bequest' : 'gift amount';
  const presets = ['once', 'annual', 'bequest'].includes(key) && (gift.custom || bequest) ? ' list="donation-larger-amounts"' : '';
  return `<div class="donation-tier" data-donation-gift="${gift.id}">
    <input type="number" inputmode="decimal" min="0" step="0.01" value="${e(gift.amount)}" aria-label="${label} ${giftName} in Australian dollars"${presets} data-gift-amount>
    <input type="range" min="0" max="${maxDonors}" step="1" value="${e(gift.donors || 0)}" aria-label="Adjust ${label.toLowerCase()} ${bequest ? 'bequest' : 'donor'} count" data-gift-slider>
    <input type="number" inputmode="numeric" min="0" max="${maxDonors}" step="1" value="${e(gift.donors)}" aria-label="${label} ${bequest ? 'bequest' : 'donor'} count" data-gift-donors>
    ${gift.custom ? `<button class="button quiet" type="button" data-gift-remove aria-label="Remove ${label.toLowerCase()} ${giftName}">×</button>` : ''}
  </div>`;
}

function giftSection(key, label, e) {
  const bequest = key === 'bequest';
  return `<div class="donation-gift-section" data-donation-gifts="${key}" data-donation-label="${label}">
    <div class="donation-tier donation-tier-labels" aria-hidden="true"><span>${bequest ? 'Bequest' : 'Gift'} (A$)</span><span></span><span>${bequest ? 'Count' : 'Donors'}</span></div>
    <div class="donation-gift-list" data-gift-list>${draft[key].map(gift => giftEditor(key, label, gift, e)).join('')}</div>
    <button class="button secondary small" type="button" data-gift-add>${bequest ? 'Add a bequest' : 'Add gift amount'}</button>
  </div>`;
}

function schedule([key, label, contributions], e) {
  return `<fieldset class="donation-schedule" data-donation-group="${key}">
    <legend>${label}</legend>
    ${giftSection(key, label, e)}
    <dl class="donation-row-results"><div><dt>First round</dt><dd data-donation-row-first>—</dd></div><div><dt>12 months · ${contributions} ${contributions === 1 ? 'gift' : 'gifts'} per donor</dt><dd data-donation-row-annual>—</dd></div></dl>
  </fieldset>`;
}

export function donationSimulatorView(e) {
  return `<section class="panel electorate-finance quick-finance donation-simulator" data-donation-simulator aria-labelledby="donation-simulator-heading">
    <h2 id="donation-simulator-heading">Donation simulator</h2>
    <p>Try a mix of gift amounts in each schedule. Move the sliders or enter the exact donor counts.</p>
    <p class="finance-context">The starter mix is a worked example for one electorate.</p>
    <dl class="finance-metrics quick-results" aria-live="polite" aria-atomic="true">
      <div><dt>Combined first round of gifts</dt><dd data-donation-first>—</dd></div>
      <div><dt>Combined total over 12 months</dt><dd data-donation-annual>—</dd></div>
    </dl>
    <p><a href="#finance/compare">Combine estimates</a></p>
    <p class="finance-context" data-donation-status role="status" hidden></p>
    <datalist id="donation-larger-amounts">${largerAmounts.map(amount => `<option value="${amount}"></option>`).join('')}</datalist>
    <div class="donation-schedules">${frequencies.map(frequency => schedule(frequency, e)).join('')}</div>
    <p class="finance-context">Each schedule assumes the same donors give at that frequency for 12 months.</p>
    <section class="donation-bequests" aria-labelledby="donation-bequests-heading">
      <h3 id="donation-bequests-heading">Bequests in wills</h3>
      <p>Explore possible gifts from wills. Their timing is uncertain, so they have a separate total.</p>
      <dl class="finance-metrics" aria-live="polite"><div><dt>Potential bequests</dt><dd data-bequest-total>—</dd></div></dl>
      ${giftSection('bequest', 'Bequest', e)}
    </section>
  </section>`;
}

export function mountDonationSimulator(root, { e }) {
  const simulator = root.querySelector('[data-donation-simulator]');
  if (!simulator) return;
  const first = simulator.querySelector('[data-donation-first]');
  const annual = simulator.querySelector('[data-donation-annual]');
  const status = simulator.querySelector('[data-donation-status]');
  const bequestTotal = simulator.querySelector('[data-bequest-total]');
  const giftSections = [...simulator.querySelectorAll('[data-donation-gifts]')];
  const schedules = [...simulator.querySelectorAll('[data-donation-group]')];

  function update() {
    for (const section of giftSections) {
      const key = section.dataset.donationGifts;
      const label = section.dataset.donationLabel;
      const countLabel = key === 'bequest' ? 'bequests' : 'donors';
      const rows = [...section.querySelectorAll('[data-donation-gift]')];
      rows.forEach((row, index) => {
        const donors = row.querySelector('[data-gift-donors]');
        const amount = row.querySelector('[data-gift-amount]');
        const slider = row.querySelector('[data-gift-slider]');
        Object.assign(draft[key][index], { donors: donors.value, amount: amount.value, validAmount: amount.validity.valid });
        const tier = amount.value && amount.validity.valid ? `${label} ${money.format(amount.valueAsNumber)}` : label;
        donors.setAttribute('aria-label', `${tier} ${countLabel}`);
        slider.setAttribute('aria-label', `Adjust ${tier} ${countLabel}`);
        slider.setAttribute('aria-valuetext', `${count.format(Number(slider.value))} ${countLabel}`);
      });
    }
    const { plan, firstReceiptCents, annualCents, bequestsCents } = draftTotals();
    first.textContent = formatMoney(firstReceiptCents);
    annual.textContent = formatMoney(annualCents);
    status.hidden = plan.complete;
    status.textContent = plan.complete ? '' : plan.firstReceiptCents === null || plan.annualCents === null
      ? 'The combined amounts are too large to calculate. Reduce the gift amounts or donor counts.'
      : 'Combined totals include entries with a valid gift amount and donor count.';
    bequestTotal.textContent = formatMoney(bequestsCents);
    for (const schedule of schedules) {
      const group = plan.groups[schedule.dataset.donationGroup];
      schedule.querySelector('[data-donation-row-first]').textContent = formatMoney(group?.firstReceiptCents);
      schedule.querySelector('[data-donation-row-annual]').textContent = formatMoney(group?.annualCents);
    }
  }

  for (const section of giftSections) {
    const { donationGifts: key, donationLabel: label } = section.dataset;
    const list = section.querySelector('[data-gift-list]');
    const add = section.querySelector('[data-gift-add]');
    list.addEventListener('input', ({ target }) => {
      const row = target.closest('[data-donation-gift]');
      const donors = row.querySelector('[data-gift-donors]');
      const slider = row.querySelector('[data-gift-slider]');
      if (target === slider) donors.value = slider.value;
      if (target === donors && donors.value && donors.validity.valid) slider.value = donors.value;
      update();
    });
    add.addEventListener('click', () => {
      const gift = { id: nextGiftId++, donors: key === 'bequest' ? '1' : '0', amount: '', custom: true };
      draft[key].push(gift);
      list.insertAdjacentHTML('beforeend', giftEditor(key, label, gift, e));
      list.lastElementChild.querySelector('[data-gift-amount]').focus();
      update();
    });
    list.addEventListener('click', ({ target }) => {
      const row = target.closest('[data-gift-remove]')?.closest('[data-donation-gift]');
      if (!row) return;
      const next = row.nextElementSibling || row.previousElementSibling;
      const index = draft[key].findIndex(gift => gift.id === Number(row.dataset.donationGift));
      draft[key].splice(index, 1);
      row.remove();
      (next?.querySelector('[data-gift-amount]') || add).focus();
      update();
    });
  }
  update();
}
