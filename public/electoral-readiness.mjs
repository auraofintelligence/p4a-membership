import { electoralJurisdictions, sourcesChecked } from './electoral-readiness-data.mjs';
import { fundingView, mountFundingCalculator } from './electoral-funding.mjs';

export { mountFundingCalculator };

const basisLabels = {
  confirmed: 'Official date',
  expected: 'Expected date',
  statutory: 'Usual date under the law',
  calculated: 'Worked out from the rules',
  planning: 'P4A planning date',
};

const dayInMilliseconds = 86400000;
const monthDay = new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const localFormatters = new Map();

export function shiftCalendarMonths(date, months) {
  const [year, month, day] = date.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

function localCalendar(now, timeZone) {
  if (!localFormatters.has(timeZone)) {
    localFormatters.set(timeZone, new Intl.DateTimeFormat('en-AU', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }));
  }
  const parts = Object.fromEntries(localFormatters.get(timeZone).formatToParts(now).map(part => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

export function countdown(date, time, local, pastLabel) {
  const days = (Date.parse(date) - Date.parse(local.date)) / dayInMilliseconds;
  if (days > 0) return { label: `${days.toLocaleString('en-AU')} ${days === 1 ? 'day' : 'days'} to go`, tone: 'future' };
  if (days < 0) return { label: pastLabel, tone: 'past' };
  if (!time) return { label: 'Today', tone: 'today' };
  const [hours, minutes] = time.split(':').map(Number);
  const remaining = hours * 60 + minutes - local.minutes;
  if (remaining <= 0) return { label: pastLabel, tone: 'past' };
  const wholeHours = Math.floor(remaining / 60);
  return { label: wholeHours ? `${wholeHours} hr ${remaining % 60} min to go` : `${remaining} min to go`, tone: 'today' };
}

export function refreshClocks(root, now = new Date()) {
  const calendar = root.querySelector('[data-readiness-time-zone]');
  if (!calendar) return;
  const local = localCalendar(now, calendar.dataset.readinessTimeZone);
  for (const clock of calendar.querySelectorAll('[data-readiness-countdown]')) {
    const value = countdown(clock.dataset.readinessCountdown, clock.dataset.cutoff, local, clock.dataset.pastLabel);
    if (clock.textContent !== value.label) clock.textContent = value.label;
    clock.dataset.tone = value.tone;
  }
}

function clockMarkup(title, date, time, local, pastLabel, e) {
  const value = countdown(date, time, local, pastLabel);
  const when = monthDay.format(new Date(date));
  return `<div class="readiness-clock">
    <span>${e(title)}</span>
    <strong data-readiness-countdown="${e(date)}" data-cutoff="${e(time || '')}" data-past-label="${e(pastLabel)}" data-tone="${value.tone}">${e(value.label)}</strong>
    <time datetime="${e(date + (time ? `T${time}` : ''))}">${e(when + (time ? ` · ${time} local` : ''))}</time>
  </div>`;
}

function stageMarkup(stage, local, e) {
  const basis = stage.date ? basisLabels[stage.basis] : 'Date to be confirmed';
  const pastLabel = stage.pastLabel || (stage.basis === 'planning' ? 'Planning date passed' : 'Date passed');
  return `<li class="readiness-stage">
    <div class="readiness-stage-heading"><h3>${e(stage.title)}</h3><span class="readiness-basis" data-basis="${e(stage.basis || 'pending')}">${e(basis)}</span></div>
    <p>${e(stage.action)}</p>
    ${stage.date ? `<div class="readiness-clocks">
      ${clockMarkup(stage.dateLabel || 'Date for this step', stage.date, stage.time, local, pastLabel, e)}
      ${clockMarkup('Aim to be ready by', shiftCalendarMonths(stage.date, -6), '', local, 'Target date passed', e)}
    </div>` : '<p class="readiness-pending">The six-month target depends on the date for this step.</p>'}
    ${stage.source ? `<a class="source-link" href="${e(stage.source)}" target="_blank" rel="noopener noreferrer">Check the official source ↗</a>` : ''}
  </li>`;
}

function senateBallotGuide() {
  return `<section class="panel" aria-labelledby="senate-ballot-title">
    <h2 id="senate-ballot-title">How the Senate ballot works</h2>
    <p>A thick black line divides the Senate ballot paper.</p>
    <ul>
      <li><strong>Above the line</strong>, rank at least six parties or groups.</li>
      <li><strong>Below the line</strong>, rank at least 12 individual candidates by name.</li>
    </ul>
    <p>A candidate running alone appears in the <strong>Ungrouped</strong> column below the line. To make them your first choice, put <strong>1</strong> beside their name and keep numbering your other choices below the line.</p>
    <p>Two or more candidates can ask to share a group box above the line. They can do this without a registered party.</p>
    <p><a href="https://www.aec.gov.au/Voting/How_to_vote/practice/practice-senate.htm" target="_blank" rel="noopener noreferrer">See and try a sample Senate ballot ↗</a></p>
  </section>`;
}

export function readinessView(id, { e, heading, icon }, now = new Date()) {
  const jurisdiction = electoralJurisdictions.find(item => item.id === id) || electoralJurisdictions[0];
  const local = localCalendar(now, jurisdiction.timeZone);
  const minimum = jurisdiction.minimum.toLocaleString('en-AU');
  const target = (jurisdiction.minimum * 2).toLocaleString('en-AU');
  return `<div class="electoral-readiness" data-readiness-time-zone="${e(jurisdiction.timeZone)}">
    ${heading('Campaign Command Centre', 'Electoral readiness', 'Choose an election to see how to register a party, run for office and claim campaign funding.', '<div class="button-row readiness-page-actions"><button type="button" class="button secondary" data-funding-jump>Funding calculator</button><a class="button quiet" href="https://p4a.xyz/pages/states.html" target="_blank" rel="noopener noreferrer">Public election clocks ↗</a></div>')}
    <nav class="readiness-jurisdictions" aria-label="Federal, state and territory elections">
      ${electoralJurisdictions.map(item => `<a href="#readiness/${e(item.id)}" aria-label="${e(item.name)}"${item === jurisdiction ? ' aria-current="page"' : ''}>${e(item.label)}</a>`).join('')}
    </nav>
    <section class="readiness-summary" aria-labelledby="readiness-jurisdiction-title">
      <div class="readiness-jurisdiction-title">${icon('readiness')}<div><h2 id="readiness-jurisdiction-title">${e(jurisdiction.name)}</h2><p>${e(jurisdiction.election)}</p></div></div>
      <div class="readiness-member-counts">
        <div><strong>${minimum}</strong><span>${e(jurisdiction.minimumLabel || 'Members needed to register')}</span></div>
        <div><strong>${target}</strong><span>P4A membership target</span></div>
      </div>
      <p>${e(jurisdiction.membership)}</p>
    </section>
    <div class="readiness-content">
      <section class="panel readiness-timeline" aria-labelledby="readiness-stages-title">
        <h2 id="readiness-stages-title">What to do and when</h2>
        <p class="readiness-intro">P4A aims to be ready six months before each step. Countdown times are local to the election.</p>
        <ol>${jurisdiction.stages.map(stage => stageMarkup(stage, local, e)).join('')}</ol>
      </section>
      <aside class="readiness-guidance" aria-label="Running for office and getting funding">
        <section class="panel"><h2>How to run for office</h2><p>${e(jurisdiction.participation)}</p><p><a href="#training/${e(jurisdiction.id)}">Open the ${e(jurisdiction.label)} training pathway →</a></p></section>
        ${jurisdiction.id === 'federal' ? senateBallotGuide() : ''}
        <section class="panel"><h2>Government funding</h2><p>${e(jurisdiction.funding)}</p><p class="readiness-note">Elected representatives receive their own pay and allowances.</p></section>
        <section class="panel"><h2>If an elected representative changes parties</h2><p>${e(jurisdiction.switching)}</p><p class="readiness-note">An elected representative can vote against their party and still be a member of it.</p></section>
        <section class="panel"><h2>Official sources</h2><p>Checked <time datetime="${sourcesChecked}">${e(monthDay.format(new Date(sourcesChecked)))}</time>. Check the official dates before you apply or spend campaign money.</p><ul>
          ${jurisdiction.sources.map(([label, url]) => `<li><a href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(label)} ↗</a></li>`).join('')}
        </ul></section>
      </aside>
    </div>
    ${fundingView(jurisdiction.id, e)}
    <a class="button quiet" href="#campaigns">Back to Campaign Command Centre</a>
  </div>`;
}
