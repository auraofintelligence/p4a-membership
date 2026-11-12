import { membershipSnapshot } from './membership-quick.mjs';
import { donationSnapshot } from './donation-simulator.mjs';
import { merchSnapshot } from './merch-quick.mjs';
import { federalFinanceDistricts, federalFinanceSources } from './finance-federal-data.mjs';
import { federalAreaByAbsCode, federalClassificationByAbsCode, federalAreaSource, federalClassificationSource } from './finance-federal-area.mjs';

const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });
const number = new Intl.NumberFormat('en-AU');
const densityNumber = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 2, maximumSignificantDigits: 4 });
const districtIndex = new Map(federalFinanceDistricts.map(district => [district.id, district]));
const names = ['Group A', 'Group B'];
const draft = [
  { district: 'federal-qld-brisbane', seats: null, donationScale: '100', merchScale: '100' },
  { district: 'federal-qld-maranoa', seats: '0', donationScale: '100', merchScale: '100' },
];
const metrics = [['membership', 'Membership receipts'], ['donations', 'Donations'], ['merch', 'Merch profit'], ['total', 'Combined estimate']];
const formatMoney = cents => cents == null ? '—' : money.format(cents / 100);
const integer = value => value === '' || value == null || !Number.isSafeInteger(Number(value)) || Number(value) < 0 ? null : Number(value);

function safeSum(values) {
  const sum = values.reduce((total, value) => total + value, 0);
  return values.every(Number.isSafeInteger) && Number.isSafeInteger(sum) ? sum : null;
}

function scaledCents(cents, scale) {
  if (scale === 0) return 0;
  if (!Number.isSafeInteger(cents) || scale === null) return null;
  const result = Math.round(cents * scale / 100);
  return Number.isSafeInteger(result) ? result : null;
}

export function combineFundraising(base, profiles, coverage) {
  const groups = profiles.map(profile => {
    const seats = integer(profile.seats);
    const donationScale = integer(profile.donationScale);
    const merchScale = integer(profile.merchScale);
    const membership = base.membershipCents;
    const donations = scaledCents(base.donationCents, donationScale);
    const merch = scaledCents(base.monthlyMerchCents, merchScale === null ? null : merchScale * 12);
    const perElectorate = { membership, donations, merch, total: safeSum([membership, donations, merch]) };
    const grouped = Object.fromEntries(metrics.map(([key]) => {
      const value = perElectorate[key];
      const total = value * seats;
      return [key, seats === 0 ? 0 : Number.isSafeInteger(total) && value !== null && seats !== null ? total : null];
    }));
    return { seats, donationScale, merchScale, perElectorate, grouped };
  });
  const assigned = safeSum(groups.map(group => group.seats));
  const withinCoverage = assigned !== null && assigned <= coverage;
  const totals = Object.fromEntries(metrics.map(([key]) => [key, withinCoverage ? safeSum(groups.map(group => group.grouped[key])) : null]));
  return { groups, assigned, withinCoverage, totals };
}

function snapshots() {
  const membership = membershipSnapshot();
  const donation = donationSnapshot();
  const merch = merchSnapshot();
  const { applicationNet, quarterNet, annualNet } = membership.byElectorate;
  const coverage = membership.jurisdictions.filter(row => membership.selectedJurisdictions.includes(row.code)).reduce((sum, row) => sum + row.covered, 0);
  return { membership, donation, merch, coverage,
    base: { membershipCents: safeSum([applicationNet, quarterNet, annualNet]), donationCents: donation.annualCents, monthlyMerchCents: merch.monthlyProfitCents } };
}

function context(district) {
  const area = federalAreaByAbsCode[district.absCode];
  return {
    area,
    density: area > 0 && district.population != null ? district.population / area : null,
    classification: federalClassificationByAbsCode[district.absCode] || null,
  };
}

function groupEditor(profile, index, membership, coverage, e) {
  const choices = membership.jurisdictions.map(({ code, name }) => `<optgroup label="${e(name)}">${federalFinanceDistricts.filter(district => district.jurisdiction === code).map(district => `<option value="${e(district.id)}"${profile.district === district.id ? ' selected' : ''}>${e(district.name)}</option>`).join('')}</optgroup>`).join('');
  return `<section class="panel" data-fundraising-group="${index}" aria-labelledby="fundraising-group-${index}">
    <h2 id="fundraising-group-${index}">${names[index]}</h2>
    <div class="finance-fields fundraising-fields">
      <label class="field">Reference electorate<select data-fundraising-field="district">${choices}</select></label>
      <label class="field">Electorates represented<input type="number" min="0" max="${coverage}" step="1" inputmode="numeric" data-fundraising-field="seats" value="${e(profile.seats)}"></label>
      <label class="field">Donation activity (%)<input type="number" min="0" step="1" inputmode="numeric" data-fundraising-field="donationScale" value="${e(profile.donationScale)}"></label>
      <label class="field">Merch activity (%)<input type="number" min="0" step="1" inputmode="numeric" data-fundraising-field="merchScale" value="${e(profile.merchScale)}"></label>
    </div>
    <dl class="fundraising-context" data-fundraising-context></dl>
    <p class="finance-context" data-fundraising-boundary hidden></p>
    <p>12-month estimate per electorate <strong data-fundraising-per-seat>—</strong></p>
  </section>`;
}

export function fundraisingCompareView({ heading, e }) {
  const { membership, coverage, base, donation, merch } = snapshots();
  if (draft[0].seats === null) draft[0].seats = coverage ? '1' : '0';
  return `<div class="electorate-finance fundraising-compare" data-fundraising-compare>
    ${heading('Electorate finance', 'Combine estimates', 'Try the same fundraising mix in two different electorate groups, then scale up.', '<button type="button" class="button" data-fundraising-export>Export CSV</button>')}
    <section class="panel" aria-labelledby="fundraising-basis-heading">
      <h2 id="fundraising-basis-heading">From your calculators</h2>
      <dl class="finance-metrics fundraising-basis">
        <div><dt>Membership receipts · 12 months</dt><dd>${formatMoney(base.membershipCents)}</dd><small>${number.format(membership.membersPerElectorate)} members per electorate · ${membership.standardShare}% standard</small> <a href="#finance">Adjust membership</a></div>
        <div><dt>Donations · 12 months</dt><dd>${formatMoney(base.donationCents)}</dd><small>Current gift mix</small> <a href="#hours">Adjust donations</a></div>
        <div><dt>Merch profit · per month</dt><dd>${formatMoney(base.monthlyMerchCents)}</dd><small>${number.format(merch.monthlyUnits)} sales per month</small> <a href="#merch">Adjust merch</a></div>
      </dl>
      ${donation.complete && merch.complete ? '' : '<p class="finance-context">The current calculators contain incomplete entries. Estimates use completed amounts.</p>'}
      <p>At 100% activity, a group uses your current donation and merch estimates. Use the electorate profiles to decide what to test.</p>
      <details class="finance-details"><summary>How to read the donation example</summary><p>The starter mix uses editable counts of small gifts. For gift-size context, the Greens reported an average of A$42.69 in their 2025 federal campaign material. Local participation is an assumption you can change. <a href="https://greens.org.au/facts" target="_blank" rel="noopener noreferrer">Greens campaign figures ↗</a></p></details>
    </section>
    <div class="fundraising-groups">${draft.map((profile, index) => groupEditor(profile, index, membership, coverage, e)).join('')}</div>
    <section class="panel" aria-labelledby="fundraising-total-heading">
      <h2 id="fundraising-total-heading">Combined 12-month estimate</h2>
      <p data-fundraising-coverage></p>
      <div class="finance-table-wrap" tabindex="0" role="region" aria-label="Combined 12-month estimates"><table class="finance-table fundraising-table">
        <thead><tr><th scope="col">Source</th><th scope="col">Group A</th><th scope="col">Group B</th><th scope="col">Combined</th></tr></thead>
        <tbody>${metrics.map(([key, label]) => `<tr${key === 'total' ? ' class="fundraising-total-row"' : ''}><th scope="row">${label}</th><td data-fundraising-total="0-${key}">—</td><td data-fundraising-total="1-${key}">—</td><td data-fundraising-total="combined-${key}">—</td></tr>`).join('')}</tbody>
      </table></div>
      <p class="finance-context">Membership counts the application, first quarter and annual payment from month four. Donations use the 12-month schedule. Merch assumes the same sales each month.</p>
      <p>Try halving donation or merch activity in one group and compare the change before you set a target.</p>
    </section>
    <div class="fundraising-sources"><a href="${e(federalFinanceSources.population)}" target="_blank" rel="noopener noreferrer">ABS population</a> <a href="${e(federalAreaSource)}" target="_blank" rel="noopener noreferrer">ABS electorate area</a> <a href="${e(federalFinanceSources.census)}" target="_blank" rel="noopener noreferrer">ABS Census</a> <a href="${e(federalClassificationSource)}" target="_blank" rel="noopener noreferrer">AEC electorate types</a></div>
  </div>`;
}

function csv(plan, coverage) {
  const decimal = cents => cents == null ? '' : (cents / 100).toFixed(2);
  const headings = ['Group', 'Reference electorate', 'State or territory', 'AEC electorate type', 'Electorates represented', 'Residents at June 2025', 'Area km²', 'Residents per km²', '2021 median weekly household income AUD', 'Donation activity %', 'Merch activity %', 'Membership per electorate AUD', 'Donations per electorate AUD', 'Merch per electorate AUD', 'Combined per electorate AUD', 'Group membership AUD', 'Group donations AUD', 'Group merch AUD', 'Group combined AUD', 'Coverage in membership calculator'];
  const rows = draft.map((profile, index) => {
    const { seats, donationScale, merchScale, perElectorate, grouped } = plan.groups[index];
    const district = districtIndex.get(profile.district);
    const { area, density, classification } = context(district);
    return [names[index], district.name, district.jurisdiction, classification, seats, district.population, area, density, district.medianHouseholdIncome,
      donationScale, merchScale, ...metrics.map(([key]) => decimal(perElectorate[key])), ...metrics.map(([key]) => decimal(grouped[key])), coverage];
  });
  rows.push(['Combined', '', '', '', plan.assigned, ...Array(10).fill(''), ...metrics.map(([key]) => decimal(plan.totals[key])), coverage]);
  return '\uFEFF' + [headings, ...rows].map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n');
}

export function mountFundraisingCompare(root, { e }) {
  const view = root.querySelector('[data-fundraising-compare]');
  if (!view) return;
  const { base, coverage } = snapshots();
  const cards = [...view.querySelectorAll('[data-fundraising-group]')];
  const exportButton = view.querySelector('[data-fundraising-export]');
  let plan;

  function update() {
    plan = combineFundraising(base, draft, coverage);
    cards.forEach((card, index) => {
      const district = districtIndex.get(draft[index].district);
      const { density, classification } = context(district);
      const entries = [
        ['AEC electorate type', classification ?? 'Unavailable'],
        ['Residents · Jun 2025', district.population == null ? 'Unavailable' : number.format(district.population)],
        ['Residents per km²', density == null ? 'Unavailable' : densityNumber.format(density)],
        ['Median household income · 2021', district.medianHouseholdIncome == null ? 'Unavailable for this boundary' : `${money.format(district.medianHouseholdIncome)} / week`],
      ];
      card.querySelector('[data-fundraising-context]').innerHTML = entries.map(([label, value]) => `<div><dt>${label}</dt><dd>${e(value)}</dd></div>`).join('');
      const boundary = card.querySelector('[data-fundraising-boundary]');
      boundary.hidden = !district.boundaryNote;
      boundary.textContent = district.boundaryNote || '';
      card.querySelector('[data-fundraising-per-seat]').textContent = formatMoney(plan.groups[index].perElectorate.total);
    });
    const coverageNote = view.querySelector('[data-fundraising-coverage]');
    coverageNote.textContent = plan.withinCoverage ? `${plan.assigned} of ${coverage} covered electorates represented. Count each electorate in one group.` : `Enter whole counts that fit within your ${coverage} covered electorates.`;
    for (const [key] of metrics) {
      plan.groups.forEach((group, index) => { view.querySelector(`[data-fundraising-total="${index}-${key}"]`).textContent = formatMoney(group.grouped[key]); });
      view.querySelector(`[data-fundraising-total="combined-${key}"]`).textContent = formatMoney(plan.totals[key]);
    }
    exportButton.disabled = !plan.withinCoverage || plan.totals.total === null;
  }

  view.addEventListener('input', ({ target }) => {
    const field = target.dataset.fundraisingField;
    if (!field) return;
    const index = Number(target.closest('[data-fundraising-group]').dataset.fundraisingGroup);
    draft[index][field] = target.value;
    update();
  });
  exportButton.addEventListener('click', () => {
    if (exportButton.disabled) return;
    const url = URL.createObjectURL(new Blob([csv(plan, coverage)], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'P4A-fundraising-scenario.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  update();
}
