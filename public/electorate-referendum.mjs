import { federalFinanceDistricts } from './finance-federal-data.mjs';
import { referendumVotes } from './electorate-budget.mjs';

const stateNames = [
  ['NSW', 'New South Wales'], ['VIC', 'Victoria'], ['QLD', 'Queensland'],
  ['WA', 'Western Australia'], ['SA', 'South Australia'], ['TAS', 'Tasmania'],
];
const regions = [...stateNames, ['ACT', 'Australian Capital Territory'], ['NT', 'Northern Territory']]
  .map(([code, name], index) => ({
    code,
    name,
    state: index < stateNames.length,
    reference: federalFinanceDistricts.reduce((sum, district) =>
      sum + (district.jurisdiction === code ? district.enrolled : 0), 0),
  }));

const number = new Intl.NumberFormat('en-AU');
const percent = new Intl.NumberFormat('en-AU', { style: 'percent', maximumFractionDigits: 2 });
const displayDate = new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const draft = { houseTotal: '150', senateTotal: '76' };

const parliamentSource = 'https://www.aph.gov.au/About_Parliament/Work_of_the_Parliament';
const constitutionSource = 'https://www.legislation.gov.au/C2004Q00685/latest/text';
const referendumSource = 'https://www.aec.gov.au/Elections/referendums/';
const writSource = 'https://www.legislation.gov.au/C2004A02908/latest/text';
const rollSource = federalFinanceDistricts[0]?.enrolmentSource;

function calendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function addCalendarMonths(date, months) {
  const result = new Date(date);
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const end = new Date(result);
  end.setUTCMonth(end.getUTCMonth() + 1, 0);
  result.setUTCDate(Math.min(date.getUTCDate(), end.getUTCDate()));
  return result;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function referendumWindow(passageDate) {
  const date = calendarDate(passageDate);
  if (!date) return null;
  const submissionStart = addCalendarMonths(date, 2);
  const submissionLimit = addCalendarMonths(date, 6);
  const firstPossibleDay = addDays(submissionStart, 33);
  return {
    submissionStart,
    submissionLimit,
    earliest: addDays(firstPossibleDay, 6 - firstPossibleDay.getUTCDay()),
    latest: addDays(submissionLimit, -(submissionLimit.getUTCDay() + 1)),
  };
}

function field(e, key, label, attributes) {
  return `<label class="field">${e(label)}<input data-referendum-field="${e(key)}" value="${e(draft[key] ?? '')}" ${attributes}></label>`;
}

function regionalInput(e, region, suffix, label, attributes) {
  const key = `${region.code}-${suffix}`;
  return `<input data-referendum-field="${key}" value="${e(draft[key] ?? '')}" type="number" aria-label="${e(`${region.name} ${label}`)}" ${attributes}>`;
}

function districtRow(e, region) {
  return `<tr>
    <th scope="row">${e(region.name)}</th>
    <td>${number.format(region.reference)}</td>
    <td>${regionalInput(e, region, 'roll', '2031 roll', 'inputmode="numeric" min="1" max="100000000" step="1" placeholder="Use reference"')}</td>
    <td>${regionalInput(e, region, 'formal', 'formal ballots as percentage of enrolment', 'inputmode="decimal" min="0" max="100" step="any"')}</td>
    <td>${regionalInput(e, region, 'yes', 'Yes votes as percentage of formal ballots', 'inputmode="decimal" min="0" max="100" step="any"')}</td>
    <td data-referendum-formal="${region.code}">—</td>
    <td data-referendum-yes="${region.code}">—</td>
    <td data-referendum-state="${region.code}">${region.state ? '—' : 'National only'}</td>
  </tr>`;
}

export function referendumView(e) {
  return `<section class="panel" data-referendum aria-labelledby="referendum-title">
    <h2 id="referendum-title">2031 federal election and referendum</h2>
    <p>The goal is to win multiple seats at each election, win the 2031 federal election and carry a constitutional referendum that year. The federal election and the referendum have separate tests.</p>

    <h3>Pass the bill in Parliament</h3>
    <p>Section 128 normally requires an absolute majority in each house. Supporting members can include allies and independents. Enter anticipated support separately from P4A seats. Chamber sizes use the current Parliament as a starting point.</p>
    <div class="finance-fields">
      ${field(e, 'houseTotal', 'Total House seats', 'type="number" inputmode="numeric" min="1" max="1000" step="1"')}
      ${field(e, 'houseSupport', 'House members supporting the bill', 'type="number" inputmode="numeric" min="0" max="1000" step="1"')}
      ${field(e, 'senateTotal', 'Total Senate seats', 'type="number" inputmode="numeric" min="1" max="1000" step="1"')}
      ${field(e, 'senateSupport', 'Senators supporting the bill', 'type="number" inputmode="numeric" min="0" max="1000" step="1"')}
    </div>
    <p data-referendum-parliament aria-live="polite"></p>
    <p><a href="${parliamentSource}" target="_blank" rel="noopener">Current Parliament numbers</a></p>

    <h3>Find the referendum window</h3>
    <p>Section 128 sets a two-to-six-month window for submitting the proposal after passage through both houses. The AEC's polling window starts on the first Saturday at least two months and 33 days after passage and ends on the last Saturday before six months have elapsed. The Governor-General sets polling day in the writ, 33 to 58 days after issue.</p>
    <div class="finance-fields">
      ${field(e, 'passage', 'Intended date of passage through both houses', 'type="date"')}
      ${field(e, 'poll', 'Intended referendum polling day', 'type="date"')}
    </div>
    <p data-referendum-dates aria-live="polite"></p>
    <p><a href="${constitutionSource}" target="_blank" rel="noopener">Constitution, section 128</a> · <a href="${writSource}" target="_blank" rel="noopener">Referendum Act, sections 8 and 9</a> · <a href="${referendumSource}" target="_blank" rel="noopener">AEC polling timetable</a></p>

    <h3>Test the double majority</h3>
    <p>A Yes result needs more than half of formal votes nationally and more than half in at least four of the six states. Territory votes count towards the national result. Some changes affecting an individual state also require a majority in that state.</p>
    <p>The reference figures are AEC adult enrolments at 30 September 2026. Leave a 2031 roll field blank to use its reference count. Enter formal ballots as a percentage of the roll and Yes votes as a percentage of formal ballots. The calculator rounds to whole votes.</p>
    <div class="finance-table-wrap" tabindex="0" role="region" aria-label="Referendum vote assumptions by state and territory">
      <table class="finance-table">
        <thead><tr><th scope="col">State or territory</th><th scope="col">AEC reference roll</th><th scope="col">2031 roll</th><th scope="col">Formal ballots %</th><th scope="col">Yes vote %</th><th scope="col">Formal votes</th><th scope="col">Yes votes</th><th scope="col">State result</th></tr></thead>
        <tbody>${regions.map(region => districtRow(e, region)).join('')}</tbody>
      </table>
    </div>
    <div class="finance-metrics" aria-live="polite">
      <p data-referendum-result>Enter formal and Yes percentages for all eight regions to test a result.</p>
    </div>
    <p><a href="${e(rollSource ?? referendumSource)}" target="_blank" rel="noopener">AEC reference enrolments</a> · <a href="${referendumSource}" target="_blank" rel="noopener">AEC referendum rules</a></p>
  </section>`;
}

function chamberSummary(name, total, support) {
  if (total === '') return `${name} — enter the chamber size.`;
  const majority = Math.floor(Number(total) / 2) + 1;
  const threshold = `${name} — ${majority} of ${total} needed.`;
  if (support === '') return threshold;
  if (Number(support) > Number(total)) return `${threshold} Support cannot exceed the chamber size.`;
  const shortfall = majority - Number(support);
  return `${threshold} ${shortfall > 0 ? `${shortfall} more needed.` : 'Threshold met.'}`;
}

function timetableSummary(passage, poll) {
  const window = referendumWindow(passage);
  if (!window) return 'Enter a passage date to see the submission and polling windows.';
  const interval = `Section 128 submission window is ${displayDate.format(window.submissionStart)} to ${displayDate.format(window.submissionLimit)}. AEC Saturday polling window is ${displayDate.format(window.earliest)} to ${displayDate.format(window.latest)}.`;
  const planned = calendarDate(poll);
  const includes2031 = window.earliest.getUTCFullYear() <= 2031 && window.latest.getUTCFullYear() >= 2031;
  if (!planned) return `${interval} ${includes2031 ? 'The polling window includes Saturdays in 2031.' : 'The polling window falls outside 2031.'}`;
  if (planned.getUTCDay() !== 6) return `${interval} Choose a Saturday for polling day.`;
  if (planned < window.earliest || planned > window.latest) return `${interval} Your Saturday falls outside the polling window.`;
  return `${interval} Your Saturday fits the polling window and ${planned.getUTCFullYear() === 2031 ? 'falls in 2031' : 'falls outside 2031'}.`;
}

export function mountReferendum(root) {
  const view = root.matches?.('[data-referendum]') ? root : root.querySelector('[data-referendum]');
  if (!view || view.dataset.referendumMounted) return;
  view.dataset.referendumMounted = 'true';
  const fields = new Map([...view.querySelectorAll('[data-referendum-field]')]
    .map(input => [input.dataset.referendumField, input]));
  const get = key => fields.get(key)?.validity.valid ? fields.get(key).value : '';
  const render = () => {
    const result = referendumVotes(regions.map(region => {
      const enteredRoll = fields.get(`${region.code}-roll`);
      return {
        ...region,
        enrolled: enteredRoll.validity.badInput || !enteredRoll.validity.valid ? 0 : Number(enteredRoll.value || region.reference),
        formalShare: get(`${region.code}-formal`),
        yesShare: get(`${region.code}-yes`),
      };
    }));
    for (const row of result.regions) {
      view.querySelector(`[data-referendum-formal="${row.code}"]`).textContent = row.complete ? number.format(row.formal) : '—';
      view.querySelector(`[data-referendum-yes="${row.code}"]`).textContent = row.complete ? number.format(row.yes) : '—';
      let stateResult = row.state ? '—' : 'National only';
      if (row.state && row.complete) {
        if (!row.formal) stateResult = 'No formal votes';
        else if (2 * row.yes === row.formal) stateResult = 'Tie';
        else stateResult = row.majority ? 'Yes majority' : 'No majority';
      }
      view.querySelector(`[data-referendum-state="${row.code}"]`).textContent = stateResult;
    }
    view.querySelector('[data-referendum-result]').textContent = result.complete
      ? `${number.format(result.yes)} Yes votes out of ${number.format(result.formal)} formal votes${result.formal ? ` (${percent.format(result.yes / result.formal)})` : ''}. ${result.states} of 6 states have a Yes majority. ${result.doubleMajority ? 'Double majority reached in this scenario.' : 'Double majority falls short in this scenario.'}`
      : 'Enter formal and Yes percentages for all eight regions to test a result.';
    view.querySelector('[data-referendum-parliament]').textContent = [
      chamberSummary('House', get('houseTotal'), get('houseSupport')),
      chamberSummary('Senate', get('senateTotal'), get('senateSupport')),
    ].join(' ');
    view.querySelector('[data-referendum-dates]').textContent = timetableSummary(get('passage'), get('poll'));
  };
  view.addEventListener('input', event => {
    const key = event.target.dataset?.referendumField;
    if (!fields.has(key)) return;
    draft[key] = event.target.value;
    render();
  });
  render();
}
