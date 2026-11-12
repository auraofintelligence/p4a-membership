const maxDonors = 10000;
const amounts = [10, 25, 50, 100];
const frequencies = [
  ['once', 'One-off', 1],
  ['monthly', 'Monthly', 12],
  ['quarterly', 'Quarterly', 4],
  ['annual', 'Annually', 1],
];
const draft = Object.fromEntries(frequencies.map(([key]) => [key, { donors: key === 'once' ? '100' : '0', amount: '25' }]));
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

export function calculateDonationPlan(input = {}) {
  const groups = Object.fromEntries(frequencies.map(([key]) => {
    const group = input[key];
    return [key, calculateDonationScenario(group?.donors, group?.amount, key)];
  }));
  const scenarios = Object.values(groups);
  const first = scenarios.reduce((total, group) => total + (group?.firstReceiptCents ?? 0), 0);
  const annual = scenarios.reduce((total, group) => total + (group?.annualCents ?? 0), 0);
  const safe = Number.isSafeInteger(first) && Number.isSafeInteger(annual);
  return { groups, firstReceiptCents: safe ? first : null, annualCents: safe ? annual : null, complete: safe && scenarios.every(Boolean) };
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
  </section>`;
}

export function mountDonationSimulator(root) {
  const simulator = root.querySelector('[data-donation-simulator]');
  if (!simulator) return;
  const first = simulator.querySelector('[data-donation-first]');
  const annual = simulator.querySelector('[data-donation-annual]');
  const status = simulator.querySelector('[data-donation-status]');
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
    const plan = calculateDonationPlan(inputs);
    const hasResult = Object.values(plan.groups).some(Boolean);
    first.textContent = formatMoney(hasResult ? plan.firstReceiptCents : null);
    annual.textContent = formatMoney(hasResult ? plan.annualCents : null);
    status.hidden = plan.complete;
    status.textContent = plan.complete ? '' : plan.firstReceiptCents === null
      ? 'The combined amounts are too large to calculate. Reduce the gift amounts or donor counts.'
      : 'Combined totals include the schedules with a valid gift amount and donor count.';
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
  update();
}
