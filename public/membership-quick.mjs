import { federalFinanceDistricts, federalFinanceSources } from './finance-federal-data.mjs';

export const membershipPrices = Object.freeze({ application: 5, standard: 120, concession: 80, processing: 2 });
export const memberOptions = Object.freeze([100, 1000, 10000]);

const names = { NSW: 'New South Wales', VIC: 'Victoria', QLD: 'Queensland', WA: 'Western Australia', SA: 'South Australia', TAS: 'Tasmania', ACT: 'Australian Capital Territory', NT: 'Northern Territory' };
const federalTotals = Object.fromEntries(Object.keys(names).map(code => [code, federalFinanceDistricts.filter(row => row.jurisdiction === code).length]));
const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 2 });
const number = new Intl.NumberFormat('en-AU');
const formatMoney = cents => money.format(cents / 100);
const { application, standard, concession, processing } = membershipPrices;
const scenario = { members: 100, share: 50, view: 'all', single: 'QLD', multiple: new Set(['QLD']), coverage: Object.fromEntries(Object.keys(names).map(code => [code, 1])) };

export function membershipProjection(covered, membersPerElectorate, standardShare) {
  const members = covered * membersPerElectorate;
  const standardMembers = Math.round(members * standardShare / 100);
  const concessionMembers = members - standardMembers;
  const annualGross = (standardMembers * standard + concessionMembers * concession) * 100;
  const applicationGross = members * application * 100;
  const quarterGross = annualGross / 4;
  const net = cents => cents - Math.round(cents * processing / 100);
  return {
    members, standardMembers, concessionMembers, annualGross, applicationGross, quarterGross,
    annualNet: net(annualGross), applicationNet: net(applicationGross), quarterNet: net(quarterGross),
  };
}

function tableRows(codes, e) {
  return codes.map(code => `<tr>
    <th scope="row">${e(names[code])}</th>
    <td><div class="quick-coverage-edit"><label class="sr-only" for="quick-${code}">${e(names[code])} electorates covered</label><input id="quick-${code}" data-quick-coverage="${code}" type="range" step="1" min="0" max="${federalTotals[code]}" value="${scenario.coverage[code]}"><output for="quick-${code}" data-quick-covered="${code}">${scenario.coverage[code]}</output></div></td>
    <td>${federalTotals[code]}</td>
    <td data-quick-members="${code}"></td>
    <td data-quick-annual="${code}"></td>
  </tr>`).join('');
}

function stateControls(e) {
  if (scenario.view === 'one') return `<label class="field quick-state-select">State or territory<select data-quick-single>${Object.entries(names).map(([code, label]) => `<option value="${code}" ${scenario.single === code ? 'selected' : ''}>${e(label)}</option>`).join('')}</select></label>`;
  if (scenario.view === 'multiple') return `<fieldset class="quick-state-options"><legend>States and territories to show</legend><div>${Object.keys(names).map(code => `<label class="finance-check" title="${e(names[code])}"><input type="checkbox" data-quick-multiple="${code}" ${scenario.multiple.has(code) ? 'checked' : ''}><abbr title="${e(names[code])}">${code}</abbr><span class="sr-only">${e(names[code])}</span></label>`).join('')}</div></fieldset>`;
  return '';
}

const shownStates = () => scenario.view === 'one' ? [scenario.single] : scenario.view === 'all' ? Object.keys(names) : Object.keys(names).filter(code => scenario.multiple.has(code));

export function membershipQuickView({ heading, e }) {
  return `<div class="electorate-finance quick-finance" data-membership-quick>
    ${heading('Campaign Command Centre', 'Electorate finance', 'See what federal membership brings in as P4A expands across Australia.', '<a class="button secondary" href="#merch">Merch calculator</a>')}
    <section class="panel quick-assumptions" aria-label="Membership assumptions">
      <p><strong>A$5</strong> to apply <span aria-hidden="true">·</span> <strong>A$120</strong> standard annual <span aria-hidden="true">·</span> <strong>A$80</strong> concession annual <span aria-hidden="true">·</span> <strong>2%</strong> processing</p>
      <p>One membership payment covers federal and state membership in this model. Each member pays for one application and one quarter on approval, then annual dues from month four if they continue.</p>
    </section>
    <section class="panel" aria-labelledby="quick-membership-heading">
      <h2 id="quick-membership-heading">Membership scenario</h2>
      <div class="finance-fields quick-drivers">
        <fieldset class="quick-option-group"><legend>Members per covered electorate</legend><div class="quick-options">
          ${memberOptions.map(value => `<label><input type="radio" name="quick-members" value="${value}" ${scenario.members === value ? 'checked' : ''}><span>${number.format(value)}</span></label>`).join('')}
        </div></fieldset>
        <label class="field quick-mix" for="quick-mix">Standard and concession mix <output id="quick-mix-label" for="quick-mix"></output><input id="quick-mix" type="range" min="0" max="100" step="1" value="${scenario.share}" aria-describedby="quick-mix-label"></label>
      </div>
      <dl class="finance-metrics quick-results" data-quick-results aria-live="polite" aria-atomic="true"></dl>
    </section>
    <section class="panel" aria-labelledby="quick-coverage-heading">
      <div class="quick-coverage-heading"><h2 id="quick-coverage-heading">Federal electorate coverage</h2><button class="button secondary" type="button" data-quick-fill>Use full coverage for this view</button></div>
      <fieldset class="quick-option-group quick-state-view"><legend>Geography</legend><div class="quick-options">
        ${[['one', 'One state'], ['multiple', 'Multiple states'], ['all', 'All states']].map(([value, label]) => `<label><input type="radio" name="quick-view" value="${value}" ${scenario.view === value ? 'checked' : ''}><span>${label}</span></label>`).join('')}
      </div></fieldset>
      <div data-quick-state-controls></div>
      <div class="finance-table-wrap" tabindex="0" role="region" aria-label="Federal electorate coverage table">
        <table class="finance-table quick-coverage-table"><thead><tr><th scope="col">State or territory</th><th scope="col">Covered</th><th scope="col">Total</th><th scope="col">Members</th><th scope="col">Net annual dues</th></tr></thead><tbody data-quick-coverage-rows></tbody></table>
      </div>
      <p class="finance-context"><a class="source-link" href="${e(federalFinanceSources.enrolment)}" target="_blank" rel="noopener noreferrer">AEC federal divisions and enrolment snapshot ↗</a></p>
    </section>
    <section class="panel" aria-labelledby="quick-formula-heading">
      <h2 id="quick-formula-heading">How the totals work</h2>
      <dl class="quick-formulas">
        <div><dt>Members</dt><dd>Covered electorates × members per electorate</dd></div>
        <div><dt>Applications</dt><dd>Members × A$5 × 98%</dd></div>
        <div><dt>Quarter on approval</dt><dd>(Standard members × A$30 + concession members × A$20) × 98%</dd></div>
        <div><dt>Annual dues</dt><dd>(Standard members × A$120 + concession members × A$80) × 98%</dd></div>
      </dl>
      <p>Amounts are after payment processing and before operating costs. Annual dues assume all modelled members continue.</p>
    </section>
    <div class="button-row quick-extra"><a href="#finance/detail">Detailed cash budgets</a><a href="#finance/referendum">2031 referendum calculator</a></div>
  </div>`;
}

export function mountMembershipQuick(root, { e }) {
  const view = root.querySelector('[data-membership-quick]');
  const results = view.querySelector('[data-quick-results]');
  const controls = view.querySelector('[data-quick-state-controls]');
  const coverageRows = view.querySelector('[data-quick-coverage-rows]');
  const mix = view.querySelector('#quick-mix');

  function calculate() {
    const codes = shownStates();
    let covered = 0;
    let available = 0;
    for (const code of codes) {
      const row = membershipProjection(scenario.coverage[code], scenario.members, scenario.share);
      view.querySelector(`[data-quick-covered="${code}"]`).textContent = scenario.coverage[code];
      view.querySelector(`[data-quick-members="${code}"]`).textContent = number.format(row.members);
      view.querySelector(`[data-quick-annual="${code}"]`).textContent = formatMoney(row.annualNet);
      covered += scenario.coverage[code];
      available += federalTotals[code];
    }
    const projection = membershipProjection(covered, scenario.members, scenario.share);
    const mixLabel = `${scenario.share}% standard · ${100 - scenario.share}% concession`;
    view.querySelector('#quick-mix-label').textContent = mixLabel;
    mix.setAttribute('aria-valuetext', mixLabel);
    const tiles = [
      ['Members', number.format(projection.members), `${number.format(covered)} of ${number.format(available)} electorates covered`],
      ['Net application fees', formatMoney(projection.applicationNet), 'One application per modelled member'],
      ['Net first-quarter dues', formatMoney(projection.quarterNet), 'Paid on approval'],
      ['Net annual dues', formatMoney(projection.annualNet), 'From month four and at annual renewal'],
    ];
    results.innerHTML = tiles.map(([label, value, note]) => `<div><dt>${label}</dt><dd>${value}</dd><small>${note}</small></div>`).join('');
  }

  function renderCoverage() {
    coverageRows.innerHTML = tableRows(shownStates(), e) || '<tr><td colspan="5">Select at least one state or territory.</td></tr>';
    view.querySelector('[data-quick-fill]').disabled = shownStates().length === 0;
    calculate();
  }

  view.addEventListener('input', ({ target }) => {
    if (target === mix) scenario.share = target.valueAsNumber;
    else if (target.dataset.quickCoverage) {
      const code = target.dataset.quickCoverage;
      scenario.coverage[code] = Math.min(federalTotals[code], Math.max(0, Math.floor(target.valueAsNumber || 0)));
      if (target.value && target.valueAsNumber !== scenario.coverage[code]) target.value = scenario.coverage[code];
    } else return;
    calculate();
  });
  view.addEventListener('change', ({ target }) => {
    if (target.name === 'quick-members') { scenario.members = Number(target.value); calculate(); return; }
    if (target.name === 'quick-view') {
      scenario.view = target.value;
      controls.innerHTML = stateControls(e);
    } else if (target.matches('[data-quick-single]')) scenario.single = target.value;
    else if (target.dataset.quickMultiple) {
      const code = target.dataset.quickMultiple;
      if (target.checked) scenario.multiple.add(code);
      else scenario.multiple.delete(code);
    } else return;
    renderCoverage();
  });
  view.querySelector('[data-quick-fill]').addEventListener('click', () => {
    for (const code of shownStates()) scenario.coverage[code] = federalTotals[code];
    renderCoverage();
  });
  controls.innerHTML = stateControls(e);
  renderCoverage();
}
