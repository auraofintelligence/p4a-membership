const maxDonors = 10000;
const amounts = [10, 25, 50, 100];
const frequencies = [
  ['once', 'One-off', 1],
  ['monthly', 'Monthly', 12],
  ['quarterly', 'Quarterly', 4],
  ['annual', 'Annually', 1],
];
const draft = { donors: '100', slider: '100', amount: '25', frequency: 'once' };
const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });
const count = new Intl.NumberFormat('en-AU');

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

export function donationSimulatorView(e) {
  return `<section class="panel electorate-finance quick-finance donation-simulator" data-donation-simulator aria-labelledby="donation-simulator-heading">
    <h2 id="donation-simulator-heading">Donation simulator</h2>
    <p>Choose a gift per person, the number of donors and how often they give.</p>
    <div class="finance-fields">
      <div class="field">
        <label for="donation-amount">Gift per donor (A$)</label>
        <input id="donation-amount" type="number" inputmode="decimal" min="0" step="0.01" value="${e(draft.amount)}" data-donation-amount>
        <div class="button-row" role="group" aria-label="Preset gifts">${amounts.map(amount => `<button type="button" class="button secondary small" data-donation-preset="${amount}">A$${amount}</button>`).join('')}</div>
      </div>
      <div class="field">
        <label for="donation-donors">Donors</label>
        <input id="donation-donors" type="number" inputmode="numeric" min="0" max="${maxDonors}" step="1" value="${e(draft.donors)}" data-donation-donors>
        <input type="range" min="0" max="${maxDonors}" step="1" value="${e(draft.slider)}" data-donation-slider aria-label="Adjust number of donors">
      </div>
      <label class="field" for="donation-frequency">How often each donor gives
        <select id="donation-frequency" data-donation-frequency>${frequencies.map(([key, label]) => `<option value="${key}"${key === draft.frequency ? ' selected' : ''}>${label}</option>`).join('')}</select>
      </label>
    </div>
    <dl class="finance-metrics quick-results" aria-live="polite" aria-atomic="true">
      <div><dt>First round of gifts</dt><dd data-donation-first>—</dd></div>
      <div><dt>Total over 12 months</dt><dd data-donation-annual>—</dd></div>
    </dl>
    <p class="finance-context" data-donation-formula></p>
    <p class="finance-context">The same donors are assumed to give each time.</p>
  </section>`;
}

export function mountDonationSimulator(root) {
  const simulator = root.querySelector('[data-donation-simulator]');
  if (!simulator) return;
  const donors = simulator.querySelector('[data-donation-donors]');
  const slider = simulator.querySelector('[data-donation-slider]');
  const amount = simulator.querySelector('[data-donation-amount]');
  const frequency = simulator.querySelector('[data-donation-frequency]');
  const first = simulator.querySelector('[data-donation-first]');
  const annual = simulator.querySelector('[data-donation-annual]');
  const formula = simulator.querySelector('[data-donation-formula]');
  const presets = simulator.querySelectorAll('[data-donation-preset]');
  const format = cents => money.format(cents / 100);

  function update() {
    Object.assign(draft, { donors: donors.value, slider: slider.value, amount: amount.value, frequency: frequency.value });
    const scenario = donors.validity.valid && amount.validity.valid ? calculateDonationScenario(draft.donors, draft.amount, draft.frequency) : null;
    first.textContent = scenario ? format(scenario.firstReceiptCents) : '—';
    annual.textContent = scenario ? format(scenario.annualCents) : '—';
    formula.textContent = scenario
      ? `${count.format(scenario.donors)} donors × ${format(scenario.amountCents)} per gift × ${scenario.contributions} ${scenario.contributions === 1 ? 'round' : 'rounds'} of gifts in 12 months`
      : 'Enter a gift amount and a whole number of donors from 0 to 10,000.';
    slider.setAttribute('aria-valuetext', `${count.format(Number(slider.value))} donors`);
    for (const button of presets) button.setAttribute('aria-pressed', String(amount.value !== '' && Number(amount.value) === Number(button.dataset.donationPreset)));
  }

  slider.addEventListener('input', () => { donors.value = slider.value; update(); });
  donors.addEventListener('input', () => {
    if (donors.value !== '' && donors.validity.valid) slider.value = donors.value;
    update();
  });
  amount.addEventListener('input', update);
  frequency.addEventListener('change', update);
  for (const button of presets) button.addEventListener('click', () => { amount.value = button.dataset.donationPreset; update(); });
  update();
}
