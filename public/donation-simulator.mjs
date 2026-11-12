const maxDonors = 10000;
const amounts = [10, 25, 50, 100];
const largerAmounts = [1000, 5000, 10000, 25000];
const largerSchedules = ['once', 'annual'];
const frequencies = [
  ['once', 'One-off', 1],
  ['monthly', 'Monthly', 12],
  ['quarterly', 'Quarterly', 4],
  ['annual', 'Annually', 1],
];
const draft = Object.fromEntries(frequencies.map(([key]) => [key, { donors: key === 'once' ? '100' : '0', amount: '25' }]));
const giftDrafts = { once: [], annual: [], bequest: [{ id: 1, donors: '1', amount: '' }] };
let nextGiftId = 2;
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
  const largerGifts = Object.fromEntries(largerSchedules.map(key => [key, (largerInput[key] || []).map(gift => calculateDonationScenario(gift?.donors, gift?.amount, key))]));
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

function giftEditor(key, gift, e) {
  const bequest = key === 'bequest';
  const giftName = bequest ? 'bequest' : 'larger gift';
  return `<div class="donation-gift" data-donation-gift="${gift.id}">
    <div class="finance-fields donation-fields">
      <label class="field">${bequest ? 'Bequests' : 'Donors'}<input type="number" inputmode="numeric" min="0" max="${maxDonors}" step="1" value="${e(gift.donors)}" data-gift-donors></label>
      <label class="field">Amount per ${bequest ? 'bequest' : 'donor'} (A$)<input type="number" inputmode="decimal" min="0" step="0.01" placeholder="Enter an amount" value="${e(gift.amount)}" data-gift-amount></label>
    </div>
    <div class="button-row" role="group" aria-label="${giftName} amount presets">${largerAmounts.map(amount => `<button type="button" class="button secondary small" data-gift-preset="${amount}">A$${count.format(amount)}</button>`).join('')}</div>
    <div class="donation-gift-footer"><p>Subtotal <strong data-gift-total>—</strong></p><button class="button quiet small" type="button" data-gift-remove>Remove<span class="sr-only"> ${giftName}</span></button></div>
  </div>`;
}

function giftSection(key, e) {
  const bequest = key === 'bequest';
  return `<div class="donation-gift-section" data-donation-gifts="${key}">
    <div class="donation-gift-list" data-gift-list>${giftDrafts[key].map(gift => giftEditor(key, gift, e)).join('')}</div>
    <button class="button secondary small" type="button" data-gift-add>${bequest ? 'Add a bequest' : 'Add a larger gift'}</button>
  </div>`;
}

function schedule([key, label, contributions], e) {
  const { donors, amount } = draft[key];
  return `<fieldset class="donation-schedule" data-donation-group="${key}">
    <legend>${label}</legend>
    <div class="finance-fields donation-fields">
      <label class="field">Donors<input type="number" inputmode="numeric" min="0" max="${maxDonors}" step="1" value="${e(donors)}" data-donation-donors></label>
      <label class="field">Gift per donor (A$)<input type="number" inputmode="decimal" min="0" step="0.01" value="${e(amount)}" data-donation-amount></label>
    </div>
    <input type="range" min="0" max="${maxDonors}" step="1" value="${e(donors || 0)}" data-donation-slider aria-label="Adjust ${label.toLowerCase()} donor count">
    <div class="button-row" role="group" aria-label="${label} gift presets">${amounts.map(gift => `<button type="button" class="button secondary small" data-donation-preset="${gift}">A$${gift}</button>`).join('')}</div>
    ${largerSchedules.includes(key) ? giftSection(key, e) : ''}
    <dl class="donation-row-results"><div><dt>First round</dt><dd data-donation-row-first>—</dd></div><div><dt>12 months · ${contributions} ${contributions === 1 ? 'gift' : 'gifts'} per donor</dt><dd data-donation-row-annual>—</dd></div></dl>
  </fieldset>`;
}

export function donationSimulatorView(e) {
  return `<section class="panel electorate-finance quick-finance donation-simulator" data-donation-simulator aria-labelledby="donation-simulator-heading">
    <h2 id="donation-simulator-heading">Donation simulator</h2>
    <p>Play with any mix of giving schedules. Set donors to 0 for a schedule you want to leave out.</p>
    <dl class="finance-metrics quick-results" aria-live="polite" aria-atomic="true">
      <div><dt>Combined first round of gifts</dt><dd data-donation-first>—</dd></div>
      <div><dt>Combined total over 12 months</dt><dd data-donation-annual>—</dd></div>
    </dl>
    <p class="finance-context" data-donation-status role="status" hidden></p>
    <div class="donation-schedules">${frequencies.map(frequency => schedule(frequency, e)).join('')}</div>
    <p class="finance-context">Each schedule assumes the same donors give at that frequency for 12 months.</p>
    <section class="donation-bequests" aria-labelledby="donation-bequests-heading">
      <h3 id="donation-bequests-heading">Bequests in wills</h3>
      <p>Explore possible gifts from wills. Their timing is uncertain, so they have a separate total.</p>
      <dl class="finance-metrics" aria-live="polite"><div><dt>Potential bequests</dt><dd data-bequest-total>—</dd></div></dl>
      ${giftSection('bequest', e)}
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
  const fields = [...simulator.querySelectorAll('[data-donation-group]')].map(row => ({
    key: row.dataset.donationGroup,
    donors: row.querySelector('[data-donation-donors]'),
    slider: row.querySelector('[data-donation-slider]'),
    amount: row.querySelector('[data-donation-amount]'),
    rowFirst: row.querySelector('[data-donation-row-first]'),
    rowAnnual: row.querySelector('[data-donation-row-annual]'),
    presets: row.querySelectorAll('[data-donation-preset]'),
  }));

  function update() {
    const inputs = Object.fromEntries(fields.map(({ key, donors, amount }) => {
      draft[key] = { donors: donors.value, amount: amount.value };
      return [key, { donors: donors.validity.valid ? donors.value : null, amount: amount.validity.valid ? amount.value : null }];
    }));
    const giftInputs = Object.fromEntries(giftSections.map(section => {
      const key = section.dataset.donationGifts;
      const rows = [...section.querySelectorAll('[data-donation-gift]')];
      return [key, rows.map((row, index) => {
        const donors = row.querySelector('[data-gift-donors]');
        const amount = row.querySelector('[data-gift-amount]');
        Object.assign(giftDrafts[key][index], { donors: donors.value, amount: amount.value });
        return { donors: donors.validity.valid ? donors.value : null, amount: amount.validity.valid ? amount.value : null };
      })];
    }));
    const plan = calculateDonationPlan(inputs, giftInputs);
    const bequests = calculateBequests(giftInputs.bequest);
    const hasResult = Object.values(plan.groups).some(Boolean);
    first.textContent = formatMoney(hasResult ? plan.firstReceiptCents : null);
    annual.textContent = formatMoney(hasResult ? plan.annualCents : null);
    status.hidden = plan.complete;
    status.textContent = plan.complete ? '' : plan.firstReceiptCents === null || plan.annualCents === null
      ? 'The combined amounts are too large to calculate. Reduce the gift amounts or donor counts.'
      : 'Combined totals include entries with a valid gift amount and donor count.';
    bequestTotal.textContent = formatMoney(bequests.gifts.some(Boolean) ? bequests.totalCents : null);
    for (const section of giftSections) {
      const key = section.dataset.donationGifts;
      const results = key === 'bequest' ? bequests.gifts : plan.largerGifts[key];
      [...section.querySelectorAll('[data-donation-gift]')].forEach((row, index) => {
        const result = results[index];
        row.querySelector('[data-gift-total]').textContent = formatMoney(result?.firstReceiptCents);
        row.querySelectorAll('[data-gift-preset]').forEach(button => button.setAttribute('aria-pressed', String(result?.amountCents === Number(button.dataset.giftPreset) * 100)));
      });
    }
    for (const { key, slider, amount, rowFirst, rowAnnual, presets } of fields) {
      const group = plan.groups[key];
      rowFirst.textContent = formatMoney(group?.firstReceiptCents);
      rowAnnual.textContent = formatMoney(group?.annualCents);
      slider.setAttribute('aria-valuetext', `${count.format(Number(slider.value))} donors`);
      for (const button of presets) button.setAttribute('aria-pressed', String(amount.value !== '' && Number(amount.value) === Number(button.dataset.donationPreset)));
    }
  }

  for (const { donors, slider, amount, presets } of fields) {
    slider.addEventListener('input', () => { donors.value = slider.value; update(); });
    donors.addEventListener('input', () => {
      if (donors.value !== '' && donors.validity.valid) slider.value = donors.value;
      update();
    });
    amount.addEventListener('input', update);
    for (const button of presets) button.addEventListener('click', () => { amount.value = button.dataset.donationPreset; update(); });
  }
  for (const section of giftSections) {
    const key = section.dataset.donationGifts;
    const list = section.querySelector('[data-gift-list]');
    const add = section.querySelector('[data-gift-add]');
    list.addEventListener('input', update);
    add.addEventListener('click', () => {
      const gift = { id: nextGiftId++, donors: '1', amount: '' };
      giftDrafts[key].push(gift);
      list.insertAdjacentHTML('beforeend', giftEditor(key, gift, e));
      list.lastElementChild.querySelector('[data-gift-amount]').focus();
      update();
    });
    list.addEventListener('click', ({ target }) => {
      const button = target.closest('button');
      const row = button?.closest('[data-donation-gift]');
      if (!row) return;
      if (button.matches('[data-gift-preset]')) row.querySelector('[data-gift-amount]').value = button.dataset.giftPreset;
      if (button.matches('[data-gift-remove]')) {
        const next = row.nextElementSibling || row.previousElementSibling;
        const index = giftDrafts[key].findIndex(gift => gift.id === Number(row.dataset.donationGift));
        giftDrafts[key].splice(index, 1);
        row.remove();
        (next?.querySelector('[data-gift-amount]') || add).focus();
      }
      update();
    });
  }
  update();
}
