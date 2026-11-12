import { federalFinanceDistricts } from './finance-federal-data.mjs';
import { stateFinanceEnrolments } from './finance-state-enrolments.mjs';
import { stateFinanceDemographics } from './finance-state-demographics.mjs';
import { electoralJurisdictions } from './electoral-readiness-data.mjs';
import { fundingByJurisdiction } from './electoral-funding-data.mjs';
import { electionEstimate } from './electoral-funding.mjs';
import { calculateElectorateBudget, cashCents, monthDate, planningMonths, operatingRequests, campaignRequests, priceForWork, projectMembership, peopleCount } from './electorate-budget.mjs';
import { merchView, mountMerch } from './electorate-merch.mjs';
import { referendumView, mountReferendum } from './electorate-referendum.mjs';

const stateNames = { NSW: 'New South Wales', VIC: 'Victoria', QLD: 'Queensland', WA: 'Western Australia', SA: 'South Australia', TAS: 'Tasmania', ACT: 'Australian Capital Territory', NT: 'Northern Territory' };
const nameKey = ({ jurisdiction, name }) => `${jurisdiction}:${name.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g, '')}`;
const demographicIndex = new Map(stateFinanceDemographics.map(row => [nameKey(row), row]));
const federal = federalFinanceDistricts.map(row => ({ ...row, level: 'federal' }));
const state = stateFinanceEnrolments.map(row => ({ ...demographicIndex.get(nameKey(row)), ...row, level: 'state' }));
const districtIndex = new Map([...federal, ...state].map(row => [row.id, row]));
const electorateLists = { federal, state };
const dates = new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium', timeZone: 'UTC' });
const months = new Intl.DateTimeFormat('en-AU', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const number = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 1 });
const dollars = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });
const formatCash = cents => dollars.format(cents / 100);
const formatDay = value => value && Number.isFinite(Date.parse(value)) ? dates.format(new Date(value)) : '';
const districtLabel = row => `${row.name} · ${row.jurisdiction}`;

const tabs = [ ['budgets', 'Electorate budgets'], ['fees', 'Membership fees'], ['merch', 'Merch and markets'], ['referendum', '2031 referendum'] ];
const districts = new Map();
const fees = {};
const intakeCosts = {};
const viewState = { level: 'federal', area: 'all', districtId: '', month: 0, tab: 'budgets' };
const blankMonths = () => Array.from({ length: planningMonths }, () => ({}));
const planFor = id => {
  if (!districts.has(id)) districts.set(id, blankMonths());
  return districts.get(id);
};

const receipts = [
  ['applications', 'Paid applications', 'count'], ['quarterly', 'First-quarter payments on approval', 'count'],
  ['quarterConcessions', 'Of those, concession members', 'count'], ['annual', 'Annual payments and renewals', 'count'],
  ['annualConcessions', 'Of those, concession members', 'count'], ['operatingGifts', 'Eligible gifts for operations', 'cash'],
  ['trade', 'Merch cash received after supplier deductions', 'cash'], ['otherOperating', 'Other permitted operating receipts', 'cash'],
  ['campaignGifts', 'Eligible gifts for this campaign', 'cash'], ['receivedFunding', 'Public campaign funding already received', 'cash'],
];
const commitments = [
  ['operatingOwed', 'Operating bills and refunds due', 'cash'], ['operatingReserve', 'Operating reserve target', 'cash'],
  ['campaignOwed', 'Campaign bills and refunds due', 'cash'], ['campaignReserve', 'Campaign reserve target', 'cash'],
];
const feesFields = [
  ['applicationFee', 'Application fee (A$)', 'cash'], ['annualPrice', 'Standard annual dues (A$)', 'cash'],
  ['concessionPrice', 'Concession annual dues (A$)', 'cash'], ['processingRate', 'Processor percentage per payment', 'pct'],
  ['processingFixed', 'Processor fixed charge (A$)', 'cash'],
];
const costFields = [
  ['directCost', 'Identity check and direct costs per application (A$)', 'cash'], ['minutes', 'Human review minutes per application', 'count'],
  ['hourly', 'Loaded review wage per hour (A$)', 'cash'], ['contribution', 'Other funding already allocated per application (A$)', 'cash'],
];
const teamFields = [
  ['volunteerHours', 'Volunteer hours you can roster', 'decimal'], ['paidHours', 'Paid hours you need to cover', 'decimal'],
  ['qualifying', 'Active members checked for this registration', 'count'], ['memberTarget', 'Active member target', 'count'],
];
const voteFields = [['formalShare', 'Formal votes as % of enrolled', 'pct'], ['firstPreferences', 'P4A first-choice share (%)', 'pct'],
  ['claimSpend', 'Eligible campaign spending for this claim', 'cash'], ['automatic', 'Recipient’s applicable automatic payment (A$)', 'cash']];
const savedKeys = new Set([...receipts, ...commitments, ...teamFields, ...voteFields, ...operatingRequests, ...campaignRequests].map(([key]) => key)
  .concat(['seatGoal', 'fundingConfirmed', 'stock', 'onlineUpfront', 'onlinePayout', 'marketUpfront', 'marketPayout']));

function source(label, url, e) {
  return url && /^https:\/\//.test(url) ? `<a class="source-link" href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(label)} ↗</a>` : '';
}

function input([key, label, type, maximum], values, group, e) {
  const max = maximum ?? (type === 'pct' ? 100 : type === 'count' ? 300000 : 1000000000);
  const step = type === 'count' ? 1 : 0.01;
  return `<label class="field">${e(label)}<input type="number" min="0" max="${max}" step="${step}" inputmode="${step === 1 ? 'numeric' : 'decimal'}" autocomplete="off" value="${e(values[key] ?? '')}" data-finance-group="${group}" data-key="${e(key)}"></label>`;
}

function demographicView(row, e) {
  const ageEntries = Object.entries(row.electorAgeGroups || {});
  const profileAvailable = row.medianAge != null || row.medianHouseholdIncome != null;
  const populationBoundary = row.populationBoundary || (row.boundaryYear ? `ABS electoral boundaries, ${row.boundaryYear}` : '');
  return `<section class="panel" aria-labelledby="finance-electorate-heading">
    <h2 id="finance-electorate-heading">${e(row.name)}</h2><p>${e(stateNames[row.jurisdiction] || row.jurisdiction)} · ${row.level === 'federal' ? 'Federal House division' : 'State or territory lower-house electorate'}</p>
    <dl class="finance-metrics">
      <div><dt>Electoral roll</dt><dd>${number.format(row.enrolled)}</dd><small>${e(formatDay(row.enrolmentDate))}</small></div>
      <div><dt>ABS resident population</dt><dd>${row.population == null ? 'Unavailable' : number.format(row.population)}</dd><small>${e(formatDay(row.populationDate))}</small></div>
      <div><dt>Median age</dt><dd>${row.medianAge == null ? 'Unavailable' : number.format(row.medianAge)}</dd>${row.medianAge == null ? '' : `<small>${e(formatDay(row.demographicsDate))}</small>`}</div>
      <div><dt>Median weekly household income</dt><dd>${row.medianHouseholdIncome == null ? 'Unavailable' : dollars.format(row.medianHouseholdIncome)}</dd>${row.medianHouseholdIncome == null ? '' : `<small>${e(formatDay(row.demographicsDate))}</small>`}</div>
    </dl>
    ${ageEntries.length ? `<p class="finance-context"><strong>Age bands on the adult electoral roll</strong> ${e(formatDay(row.electorAgeDate))} · ${ageEntries.map(([age, total]) => `${e(age)} · ${number.format(total)}`).join(' / ')}</p>` : ''}
    ${row.enrolmentNote ? `<p class="finance-context">${e(row.enrolmentNote)}</p>` : ''}
    ${populationBoundary ? `<p class="finance-context"><strong>Population geography</strong> ${e(populationBoundary)} ${row.level === 'state' ? source('ABS electoral geography', row.boundarySource, e) : ''}</p>` : ''}
    ${row.boundaryNote ? `<p class="finance-context">${e(row.boundaryNote)} ${source('Redistribution', row.boundarySource, e)}</p>` : ''}
    ${row.populationNote ? `<p class="finance-context">${e(row.populationNote)}</p>` : ''}
    <p class="finance-context">${row.demographicsBoundary ? `<strong>Census geography</strong> ${e(row.demographicsBoundary)}. ` : ''}${e(row.demographicsNote || (profileAvailable ? 'Census medians describe residents and households in 2021.' : 'Compatible Census age and income medians are unavailable for this electorate.'))}</p>
    <div class="button-row finance-sources">${source('Electoral commission roll', row.enrolmentSource, e)} ${source('ABS population', row.populationSource, e)} ${profileAvailable ? source('Census profile', row.demographicsSource, e) : ''} ${source('AEC enrolled age bands', row.electorAgeSource, e)}</div>
  </section>`;
}

function growthPanel(e) {
  const fields = [['applicants', 'Paid applications in the selected month for this electorate', 'count'], ['applicantsPerRoll', 'First-month applications per 10,000 enrolled for the portfolio', 'decimal', 10000], ['growth', 'Monthly growth in applications (%)', 'pct', 1000],
    ['approval', 'Applicants taking up the paid quarter (%)', 'pct'], ['continuation', 'Quarter members moving to annual dues (%)', 'pct'],
    ['renewal', 'Annual members renewing (%)', 'pct'], ['concession', 'Members using the concession rate (%)', 'pct']];
  return `<details class="panel finance-details"><summary>Project membership growth through 2031</summary>
    <p>Use your own assumptions. Apply to this electorate to replace its payment counts from the selected month onward. For the portfolio, use applications per 10,000 on each published roll. That option leaves existing payment-count plans intact. Enter election, fundraising and staffing costs separately.</p>
    <div class="finance-fields">${fields.map(field => input(field, {}, 'growth', e)).join('')}</div>
    <div class="button-row"><button type="button" class="button secondary" data-finance-action="growth">Apply growth to this electorate</button><button type="button" class="button secondary" data-finance-action="portfolio-growth">Apply growth across the displayed portfolio</button></div><p class="finance-context" role="status" data-finance-growth-status></p>
  </details>`;
}

function fundingPanel(row, entry, e) {
  const data = fundingByJurisdiction[row.level === 'federal' ? 'federal' : row.jurisdiction.toLowerCase()];
  const scheme = data.schemes[0];
  return `<details class="panel finance-details" data-finance-funding><summary>Votes, seat target and possible election funding</summary>
    <p>${e(scheme.label)}. ${e(scheme.note)}</p>
    <div class="finance-fields">${input(['seatGoal', 'Seats targeted in this election', 'count', districtSeats(row)], entry, 'month', e)}${voteFields.filter(([key]) => key !== 'automatic' || row.level === 'federal').filter(([key]) => key !== 'claimSpend' || scheme.kind === 'reimbursement').map(field => input(field, entry, 'month', e)).join('')}</div>
    ${scheme.kind === 'none' ? '' : `<label class="finance-check"><input type="checkbox" data-finance-group="month" data-key="fundingConfirmed" ${entry.fundingConfirmed ? 'checked' : ''}> Use this funding rule for the illustration. I have checked its registration and contest conditions.</label>`}
    <p class="finance-context" data-finance-vote-result role="status"></p>
    <p>First-choice vote shares are planning targets. Preferences and the full count determine results. Expected reimbursements stay outside the cash budget. Enter the amount actually received under campaign receipts.</p>
    ${source('Official election funding rules', scheme.source, e)}
  </details>`;
}

function budgetMarkup(row, entry, e) {
  const quoteFields = ['online', 'market'].filter(channel => entry[`${channel}Upfront`] != null || entry[`${channel}Payout`] != null).flatMap(channel => [
    [`${channel}Upfront`, `${channel === 'online' ? 'Online shop' : 'Market stall'} quote, upfront costs`, 'cash'],
    [`${channel}Payout`, `${channel === 'online' ? 'Online shop' : 'Market stall'} quote, proceeds after remaining costs`, 'cash'],
  ]);
  return `${demographicView(row, e)}
    <section class="panel" aria-labelledby="finance-local-budget"><h2 id="finance-local-budget">Cash available this month</h2><div data-finance-cash></div></section>
    <section class="panel" aria-labelledby="finance-cash-inputs"><h2 id="finance-cash-inputs">Receipts and commitments</h2>
      <p>Model when cash clears. Quote prices in <button class="finance-text-button" data-finance-tab="fees" type="button">Membership fees</button>. Enter tax, chargebacks and refund obligations before committing money. For a stocked product, enter the cleared sale proceeds here and record the cost of buying the stock separately.</p>
      <div class="finance-fields">${receipts.map(field => input(field, entry, 'month', e)).join('')}</div><p class="finance-context" data-finance-cohort></p>
      <h3>Bills and reserves</h3><p class="finance-context">Enter new bills only. Unpaid bills carry into the next month. A blank reserve carries the previous target forward. Enter 0 to release it.</p>
      <div class="finance-fields">${commitments.map(field => input(field, entry, 'month', e)).join('')}</div>
      <h3>Stock and market costs before sales</h3><p>These costs can only be funded from opening cash after bills and reserves. Use the <button class="finance-text-button" type="button" data-finance-tab="merch">merch calculator</button> to price each channel.</p>
      <div class="finance-fields">${input(['stock', 'Upfront stock and selling costs', 'cash'], entry, 'month', e)}</div>
      ${quoteFields.length ? `<p>Same-month sales scenarios from merch quotes. They enter this projection only when the upfront costs can be paid. Remove both figures when switching to actual receipts and costs for that run.</p><div class="finance-fields">${quoteFields.map(field => input(field, entry, 'month', e)).join('')}</div>` : ''}
      <h3>Operating work you want to fund</h3><div class="finance-fields">${operatingRequests.map(([key, label]) => input([key, label, 'cash'], entry, 'month', e)).join('')}</div>
      <h3>Campaign work you want to fund</h3><div class="finance-fields">${campaignRequests.map(([key, label]) => input([key, label, 'cash'], entry, 'month', e)).join('')}</div>
      <p>Each list is funded in the order shown, after bills and reserves. A cost that cannot be paid in full stays unfunded. Enter the quote again in the month you expect to pay it.</p>
    </section>
    <section class="panel"><h2>People and capacity</h2><p>Enter volunteer availability and paid workload separately. Use the wage quote and on-costs when budgeting staff. Cash figures do not assign a dollar value to C-hours.</p><div class="finance-fields">${teamFields.map(field => input(field, entry, 'month', e)).join('')}</div><p data-finance-team class="finance-context"></p></section>
    ${growthPanel(e)}${fundingPanel(row, entry, e)}`;
}

function feeMarkup(e) {
  return `<section class="panel" aria-labelledby="finance-fees-title">
    <h2 id="finance-fees-title">Test the fee before setting it</h2>
    <p>These prices apply across the plans in this session. Enter a provider quote and compare the standard and concession prices. The initial quarter is one fourth of annual dues. Continuing members pay for the next 12 months at month four.</p>
    <div class="finance-fields">${feesFields.map(field => input(field, fees, 'fees', e)).join('')}</div>
    <div data-finance-fee-totals></div>
    <h3>What does an application cost?</h3><p>Enter a verification quote, paid review time and any other funding already allocated. Include minimum charges and the staff on-costs in the quote. Use this to decide what the application charge needs to cover.</p>
    <div class="finance-fields">${costFields.map(field => input(field, intakeCosts, 'intake', e)).join('')}</div><p data-finance-intake role="status"></p>
    <h3>What members get</h3><p>Compare the annual fee with the budget for secure collaboration and included AI, local organising, training and participation in shaping rules and policy. A concession or supporter price can change the amount paid while preserving the same participation rights.</p>
    <p>Electoral registration and incorporation are separate decisions. Record which entity invoices, accepts gifts, sells products and pays expenses. ${source('AEC party registration guide', 'https://www.aec.gov.au/Parties_and_Representatives/Party_Registration/guide/files/party-registration-guide.pdf', e)} ${source('ASIC entity structures', 'https://www.asic.gov.au/for-business-and-companies/nfps-and-charities/registering-and-structuring-not-for-profit-organisations', e)}</p>
  </section>`;
}

export function electorateFinanceView({ heading }) {
  return `<div class="electorate-finance">${heading('Campaign Command Centre', 'Electorate finance', 'Start at A$0. Plan cash, people and seat targets for each electorate through 2031.', '<a class="button secondary" href="#campaigns">Campaign Command Centre</a>')}
    <nav class="finance-tabs" aria-label="Finance calculators"></nav><div data-finance-content></div></div>`;
}

function table(headers, rows, e) {
  return `<div class="finance-table-wrap" tabindex="0" role="region" aria-label="${e(headers[0])} table"><table class="finance-table"><thead><tr>${headers.map(label => `<th scope="col">${e(label)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(([label, ...values]) => `<tr><th scope="row">${e(label)}</th>${values.map(value => `<td>${e(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function cashView(result, e) {
  const { op, campaign } = result;
  const rows = [['Opening cash', 'opening'], ['Receipts in the month', 'income'], ['Of those, modelled merch proceeds', 'quotedReceipts'], ['Bills and charges paid', 'paidBills'], ['New spending funded', 'plannedSpend'],
    ['Closing cash', 'closing'], ['Reserve held', 'reserve'], ['Free cash after reserve', 'available'], ['Bills still owed', 'unpaidBills'], ['New work to defer', 'deferred']];
  const issue = op.unpaidBills || campaign.unpaidBills ? '<p class="finance-callout">There are bills this plan cannot pay. Resolve them before committing new spending from that account.</p>' : '';
  const lines = [...op.lines, ...campaign.lines].filter(line => line.requested).map(line => [line.label, formatCash(line.requested), formatCash(line.funded), formatCash(line.deferred)]);
  return `<p>Membership receipts before processor charges ${formatCash(result.grossFees)}. Processor charges ${formatCash(result.processingFees)}. Each account starts at A$0 in November 2026. Release spending only after the cash clears.</p>
    ${table(['Cash flow', 'Operations', 'Campaign'], rows.map(([label, key]) => [label, formatCash(op[key]), formatCash(campaign[key])]), e)}${issue}
    ${lines.length ? table(['New spending', 'Requested', 'Funded', 'Deferred'], lines, e) : ''}`;
}

function viewDistricts() {
  return electorateLists[viewState.level].filter(row => viewState.area === 'all' || row.jurisdiction === viewState.area);
}

const districtSeats = row => row.level !== 'state' ? 1 : row.jurisdiction === 'TAS' ? 7 : row.jurisdiction === 'ACT' ? 5 : 1;

function portfolioMarkup(rows, e) {
  const sums = { enrolled: 0, active: 0, qualifying: 0, op: 0, campaign: 0, unpaid: 0, deferred: 0, planned: 0 };
  const goals = new Map();
  const annualTotals = new Map();
  for (const row of rows) {
    sums.enrolled += row.enrolled;
    const plan = districts.get(row.id);
    if (!plan) continue;
    const schedule = calculateElectorateBudget(plan, fees);
    const result = schedule[viewState.month];
    sums.active += result.active;
    sums.qualifying += result.qualifying;
    sums.op += result.op.closing;
    sums.campaign += result.campaign.closing;
    sums.unpaid += result.op.unpaidBills + result.campaign.unpaidBills;
    sums.deferred += result.op.deferred + result.campaign.deferred;
    if (plan.some(entry => Object.values(entry).some(Boolean))) sums.planned++;
    const years = new Map();
    plan.forEach((entry, index) => {
      const date = monthDate(index);
      const year = date.getUTCFullYear();
      if (entry.seatGoal) {
        const seats = Math.min(districtSeats(row), peopleCount(entry.seatGoal));
        years.set(year, Math.max(years.get(year) || 0, seats));
      }
      if (!annualTotals.has(year)) annualTotals.set(year, { opFlow: 0, campaignFlow: 0, members: 0, volunteers: 0, paid: 0 });
      const total = annualTotals.get(year);
      const budget = schedule[index];
      total.opFlow += budget.op.cashMovement;
      total.campaignFlow += budget.campaign.cashMovement;
      total.volunteers += budget.volunteerHours;
      total.paid += budget.paidHours;
      if (date.getUTCMonth() === 11) total.members += budget.active;
    });
    for (const [year, seats] of years) goals.set(year, (goals.get(year) || 0) + seats);
  }
  const lawKey = viewState.level === 'federal' ? 'federal' : viewState.area.toLowerCase();
  const rule = electoralJurisdictions.find(item => item.id === lawKey);
  const rollupName = viewState.area === 'all' ? (viewState.level === 'federal' ? 'Australia · federal House' : 'All state and territory lower houses') : `${stateNames[viewState.area]} · ${viewState.level === 'federal' ? 'federal House divisions' : 'state or territory electorates'}`;
  return `<h2>${e(rollupName)}</h2><p>${rows.length} electorates · ${number.format(sums.enrolled)} on the published rolls · ${sums.planned} with a plan. Cash is summed across these electorates. Funding remains with the account that received it. Federal and state views cover overlapping people and must be read separately.</p>
    ${table(['Portfolio totals for the selected month', 'Total'], [['Active paying members', number.format(sums.active)], ['Checked qualifying members', number.format(sums.qualifying)],
      ['Closing operating cash', formatCash(sums.op)], ['Closing campaign cash', formatCash(sums.campaign)], ['Bills still owed', formatCash(sums.unpaid)], ['Work deferred', formatCash(sums.deferred)]], e)}
    ${rule && (viewState.level !== 'federal' || viewState.area === 'all') ? `<p>P4A registration target ${number.format(rule.minimum * 2)} checked members. Gap in this plan ${number.format(Math.max(0, rule.minimum * 2 - sums.qualifying))}.</p>` : ''}
    ${sums.planned ? `<details class="finance-details" data-finance-horizon><summary>Growth and cash flow through 2031</summary>${table(['Year', 'Members at year end', 'Volunteer hours', 'Paid hours needed', 'Operating cash flow', 'Campaign cash flow', 'Seats targeted'], [...annualTotals].map(([year, total]) => [year, number.format(total.members), number.format(total.volunteers), number.format(total.paid), formatCash(total.opFlow), formatCash(total.campaignFlow), goals.get(year) || 0]), e)}<p>2026 starts in November. Seat targets for an electorate are counted once per year. Enter planned paid hours and the budget to fund them separately.</p></details>` : '<p>No electorate plans entered for this portfolio yet.</p>'}
    <p><strong>2031 objective</strong> Win multiple seats at each election, win government federally in 2031 and pass a constitutional referendum that year. <button class="finance-text-button" type="button" data-finance-tab="referendum">Explore the referendum numbers</button></p>`;
}

export function mountElectorateFinance(root, { e }) {
  const wrapper = root.querySelector('.electorate-finance');
  if (!wrapper) return;
  const display = wrapper.querySelector('[data-finance-content]');
  const selected = () => districtIndex.get(viewState.districtId);
  const selectedPlan = () => planFor(selected().id);
  const update = () => {
    if (viewState.tab === 'fees') {
      const application = cashCents(fees.applicationFee);
      const annual = cashCents(fees.annualPrice);
      const concession = Math.min(annual, cashCents(fees.concessionPrice) || annual);
      const row = (label, standard, reduced) => [label, annual ? formatCash(standard) : 'Enter annual price', annual ? formatCash(reduced) : 'Enter annual price'];
      display.querySelector('[data-finance-fee-totals]').innerHTML = table(['Payment schedule', 'Standard', 'Concession'], [
        ['Application charge', formatCash(application), formatCash(application)],
        row('First quarter on approval', Math.round(annual / 4), Math.round(concession / 4)),
        row('Annual charge from month four', annual, concession),
        row('Total by month four for continuing members', application + annual + Math.round(annual / 4), application + concession + Math.round(concession / 4)),
      ], e);
      const result = priceForWork({ ...intakeCosts, rate: fees.processingRate, fixed: fees.processingFixed });
      display.querySelector('[data-finance-intake]').textContent = `Per application · direct cost ${formatCash(result.direct)} · paid review ${formatCash(result.review)} · fee to break even ${result.breakEven == null ? 'unavailable at this processor rate' : formatCash(result.breakEven)}.`;
      return;
    }
    if (viewState.tab !== 'budgets') return;
    const row = selected();
    const plan = selectedPlan();
    const entry = plan[viewState.month];
    const result = calculateElectorateBudget(plan.slice(0, viewState.month + 1), fees).at(-1);
    display.querySelector('[data-finance-cash]').innerHTML = cashView(result, e);
    display.querySelector('[data-finance-cohort]').textContent = cashCents(fees.annualPrice) < 2 && (entry.quarterly || entry.annual) ? 'Set the annual dues in Membership fees to include paid members and their receipts.' : `${result.annualDue} eligible for annual payment this month from the earlier quarter and renewal cohorts.${result.annualRequested > result.annual ? ` ${result.annualRequested - result.annual} entered annual payments exceed those cohorts and are excluded from cash.` : ''}`;
    display.querySelector('[data-finance-team]').textContent = `${number.format(result.active)} active members · ${number.format(result.qualifying)} checked for registration · ${number.format(Math.max(0, peopleCount(entry.memberTarget) - result.active))} to reach the active member target.`;
    const scheme = fundingByJurisdiction[row.level === 'federal' ? 'federal' : row.jurisdiction.toLowerCase()].schemes[0];
    const resultText = display.querySelector('[data-finance-vote-result]');
    if (entry.formalShare != null && entry.firstPreferences != null) {
      const estimate = electionEstimate(scheme, { enrolled: row.enrolled, formalPercent: entry.formalShare, voteShare: entry.firstPreferences,
        scope: scheme.qualifyingOnly && entry.fundingConfirmed ? 'qualifying' : 'single', spend: entry.claimSpend, automatic: entry.automatic });
      resultText.textContent = `${number.format(estimate.formalVotes)} formal votes · ${number.format(estimate.votes)} first-choice votes.${entry.fundingConfirmed && estimate.estimate != null ? ` Illustrative funding ${dollars.format(estimate.estimate)}.` : ''}`;
    } else resultText.textContent = 'Enter both vote percentages to see a result.';
    const portfolio = display.querySelector('[data-finance-portfolio]');
    const horizonOpen = portfolio.querySelector('[data-finance-horizon]')?.open;
    portfolio.innerHTML = portfolioMarkup(viewDistricts(), e);
    if (horizonOpen && portfolio.querySelector('[data-finance-horizon]')) portfolio.querySelector('[data-finance-horizon]').open = true;
  };

  const show = focusId => {
    wrapper.querySelector('.finance-tabs').innerHTML = tabs.map(([key, label]) => `<button type="button" data-finance-tab="${key}" aria-pressed="${viewState.tab === key}">${e(label)}</button>`).join('');
    if (viewState.tab === 'fees') display.innerHTML = feeMarkup(e);
    else if (viewState.tab === 'merch') {
      display.innerHTML = `<p class="finance-context">Budget scenario destination · ${e(districtLabel(selected()))} · ${e(months.format(monthDate(viewState.month)))}</p>${merchView(e)}`;
      mountMerch(display, { onApply: (quote, channel) => {
        const payout = Math.round(quote.cash + quote.upfront);
        if (payout < 0) return 'The remaining costs exceed the sales proceeds. Enter the costs and receipts by date or revise the quote before applying it.';
        const entry = selectedPlan()[viewState.month];
        entry[`${channel}Upfront`] = Math.round(quote.upfront) / 100;
        entry[`${channel}Payout`] = payout / 100;
        return `Quote applied to ${selected().name} for ${months.format(monthDate(viewState.month))}. Open Electorate budgets to see if the upfront costs can be funded.`;
      } });
    }
    else if (viewState.tab === 'referendum') { display.innerHTML = referendumView(e); mountReferendum(display); }
    else {
      const rows = viewDistricts();
      if (!rows.some(row => row.id === viewState.districtId)) viewState.districtId = rows[0].id;
      const row = selected();
      display.innerHTML = `<section class="panel finance-selector" aria-label="Choose an electorate and planning month">
        <div class="finance-fields">
          <label class="field">Electoral map<select id="finance-level"><option value="federal" ${viewState.level === 'federal' ? 'selected' : ''}>Federal House</option><option value="state" ${viewState.level === 'state' ? 'selected' : ''}>State and territory lower houses</option></select></label>
          <label class="field">State or territory<select id="finance-area"><option value="all">All</option>${Object.entries(stateNames).map(([id, name]) => `<option value="${id}" ${viewState.area === id ? 'selected' : ''}>${e(name)}</option>`).join('')}</select></label>
          <label class="field">Electorate<select id="finance-district">${rows.map(item => `<option value="${e(item.id)}" ${row.id === item.id ? 'selected' : ''}>${e(districtLabel(item))}</option>`).join('')}</select></label>
          <label class="field">Planning month<select id="finance-month">${Array.from({ length: planningMonths }, (_, index) => `<option value="${index}" ${viewState.month === index ? 'selected' : ''}>${e(months.format(monthDate(index)))}</option>`).join('')}</select></label>
        </div><p>Enter scenarios and compare electorates in this session. The planner has no bank connection and sends no transactions. Save a copy to keep your work.</p>
        <div class="button-row"><button class="button secondary" type="button" data-finance-action="export">Save plan to a file</button><label class="field finance-import">Open saved plan<input data-finance-import type="file" accept=".json,application/json"></label></div><p class="finance-context" data-finance-file-status role="status"></p>
      </section><section class="panel" data-finance-portfolio></section>${budgetMarkup(row, selectedPlan()[viewState.month], e)}`;
    }
    update();
    if (focusId) wrapper.querySelector(`#${focusId}`)?.focus();
  };

  wrapper.addEventListener('input', event => {
    const { financeGroup, key } = event.target.dataset;
    if (!financeGroup || financeGroup === 'growth') return;
    const data = financeGroup === 'month' ? selectedPlan()[viewState.month] : financeGroup === 'fees' ? fees : intakeCosts;
    if (event.target.type === 'checkbox') data[key] = event.target.checked;
    else if (!event.target.value) delete data[key];
    else if (event.target.validity.valid) data[key] = event.target.valueAsNumber;
    else return;
    update();
  });
  wrapper.addEventListener('change', async event => {
    const { id, value } = event.target;
    if (id === 'finance-level') viewState.level = value;
    else if (id === 'finance-area') viewState.area = value;
    else if (id === 'finance-district') viewState.districtId = value;
    else if (id === 'finance-month') viewState.month = Number(value);
    else if (event.target.matches('[data-finance-import]')) {
      const status = display.querySelector('[data-finance-file-status]');
      try {
        const file = event.target.files[0];
        if (!file || file.size > 12000000) throw new Error('Choose a P4A plan file under 12 MB.');
        const saved = JSON.parse(await file.text());
        if (saved?.version !== 1 || !Array.isArray(saved.plans)) throw new Error('This file is not a P4A electorate plan.');
        const allowed = (record, keys) => Object.fromEntries(Object.entries(record || {}).filter(([key, val]) => keys.has(key) && (typeof val === 'boolean' || Number.isFinite(val) && val >= 0)));
        const loaded = new Map();
        for (const [districtId, entries] of saved.plans) {
          if (!districtIndex.has(districtId) || !Array.isArray(entries) || entries.length !== planningMonths) throw new Error('The file contains an unknown electorate or period.');
          loaded.set(districtId, entries.map(entry => allowed(entry, savedKeys)));
        }
        districts.clear();
        for (const [districtId, entries] of loaded) districts.set(districtId, entries);
        for (const key of Object.keys(fees)) delete fees[key];
        Object.assign(fees, allowed(saved.fees, new Set(feesFields.map(([key]) => key))));
        show();
        display.querySelector('[data-finance-file-status]').textContent = 'Plan opened.';
      } catch (error) { status.textContent = error.message; }
      return;
    } else return;
    show(id);
  });
  wrapper.addEventListener('click', event => {
    const tab = event.target.closest('[data-finance-tab]')?.dataset.financeTab;
    if (tab) {
      viewState.tab = tab;
      show();
      wrapper.querySelector(`.finance-tabs [data-finance-tab="${tab}"]`)?.focus();
      return;
    }
    const action = event.target.closest('[data-finance-action]')?.dataset.financeAction;
    if (action === 'export') {
      const plan = { version: 1, fees, plans: [...districts].filter(([, entries]) => entries.some(entry => Object.keys(entry).length)) };
      const url = URL.createObjectURL(new Blob([JSON.stringify(plan)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'P4A-electorate-plan.json';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    if (action === 'growth' || action === 'portfolio-growth') {
      const portfolio = action === 'portfolio-growth';
      const fields = [...display.querySelectorAll('[data-finance-group="growth"]')].filter(field => field.dataset.key !== (portfolio ? 'applicants' : 'applicantsPerRoll'));
      const status = display.querySelector('[data-finance-growth-status]');
      if (fields.some(field => !field.value || !field.validity.valid)) { status.textContent = 'Enter the five rates and the starting applications figure for the scope you chose. Use 0 for a rate you want to set to zero.'; return; }
      const assumptions = Object.fromEntries(fields.map(field => [field.dataset.key, field.valueAsNumber]));
      let projected = 0;
      if (portfolio) {
        for (const row of viewDistricts()) {
          const plan = districts.get(row.id);
          if (plan?.slice(viewState.month).some(entry => ['applications', 'quarterly', 'annual'].some(key => key in entry))) continue;
          const applicants = Math.round(row.enrolled * assumptions.applicantsPerRoll / 10000);
          projectMembership(planFor(row.id), viewState.month, { ...assumptions, applicants });
          projected++;
        }
      } else projectMembership(selectedPlan(), viewState.month, assumptions);
      show();
      const reopened = display.querySelector('[data-finance-growth-status]');
      reopened.closest('details').open = true;
      reopened.textContent = portfolio ? `Applied to ${projected} electorates through December 2031. Existing payment-count plans were kept.` : 'Growth applied to this electorate from the selected month through December 2031.';
      reopened.closest('details').querySelector('summary').focus();
    }
  });
  show();
}
