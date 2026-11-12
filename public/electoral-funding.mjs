import { regionalEnrolment, enrolmentSource, fundingByJurisdiction } from './electoral-funding-data.mjs';

const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 2 });
const whole = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 });

const nonNegative = value => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
const ratio = value => Math.min(100, nonNegative(value)) / 100;

export function electionEstimate(scheme, scenario) {
  const formalVotes = Math.round(Math.floor(nonNegative(scenario.enrolled)) * ratio(scenario.formalPercent));
  const votes = Math.round(formalVotes * ratio(scenario.voteShare));
  const share = formalVotes ? votes / formalVotes * 100 : 0;
  const supported = scheme.kind !== 'none';
  const aggregate = scenario.scope === 'qualifying';
  const elected = scheme.electedQualifies && scenario.elected;
  const meetsThreshold = scheme.strict ? share > scheme.threshold : share >= scheme.threshold;
  const qualified = supported && votes > 0 && (aggregate || elected || (!scheme.qualifyingOnly && meetsThreshold));
  const firstTier = scheme.taperRate == null ? 0 : Math.min(votes, formalVotes / 10);
  const voteValue = qualified ? firstTier * nonNegative(scheme.taperRate) + (votes - firstTier) * nonNegative(scheme.rate) : 0;
  const hasSpend = scenario.spend !== '' && scenario.spend != null;
  const automatic = qualified ? nonNegative(scheme.automatic ?? scenario.automatic) : 0;
  const estimate = !qualified ? 0 : scheme.kind === 'direct' ? voteValue
    : hasSpend ? Math.max(automatic, Math.min(voteValue, nonNegative(scenario.spend))) : null;
  return { formalVotes, votes, share, supported, qualified, voteValue, estimate };
}

export function administrativeEstimate(model, houseSeats, senateSeats) {
  const house = Math.floor(nonNegative(houseSeats));
  const senate = Math.floor(nonNegative(senateSeats));
  if (model.senateRate != null) return house * model.first + senate * model.senateRate;
  if (!house) return 0;
  if (model.tiers) {
    const band = model.tiers.findLast(([minimum]) => house >= minimum)[1];
    const extra = model.extraRate == null ? 0 : Math.max(0, Math.min(house, model.maxSeats) - model.extraAfter) * model.extraRate;
    return band + extra;
  }
  if (model.additional != null) {
    const count = Math.min(house, model.maxSeats);
    return model.first + (count >= 2 ? model.second : 0) + Math.max(0, count - 2) * model.additional;
  }
  return house * model.first;
}

function numberField(label, name, { value = '', max, step = 1, min = 0 } = {}) {
  return `<label class="field">${label}<input name="${name}" type="number" min="${min}" ${max == null ? '' : `max="${max}"`} step="${step}" value="${value}" inputmode="${step === 1 ? 'numeric' : 'decimal'}"></label>`;
}

function administrationMarkup(admin, e) {
  if (!admin) return '';
  return `<details class="readiness-calculation-option">
    <summary>Estimate funding for running a party with elected representatives</summary>
    <p>${e(admin.note)}</p>
    <div class="readiness-calculator-fields">
      ${numberField(admin.senateRate == null ? 'Elected representatives who meet the funding rules' : 'Members of the House of Representatives', 'house', { value: 0, max: 250 })}
      ${admin.senateRate == null ? '' : numberField('Senators', 'senate', { value: 0, max: 76 })}
    </div>
    <p><strong data-funding-value="admin">${money.format(0)}</strong> ${e(admin.period)}</p>
    <a class="source-link" href="${e(admin.source)}" target="_blank" rel="noopener noreferrer">Official rules for this ongoing funding ↗</a>
  </details>`;
}

function comparisonsMarkup(comparison, e) {
  if (!comparison) return '';
  return `<section class="panel readiness-comparisons" aria-labelledby="readiness-comparisons-title">
    <h2 id="readiness-comparisons-title">What parties received</h2>
    <p>${e(comparison.period)}</p>
    ${comparison.payments.length ? `<dl>${comparison.payments.map(([name, amount]) => `<div><dt>${e(name)}</dt><dd>${money.format(amount)}</dd></div>`).join('')}</dl>` : ''}
    <a class="source-link" href="${e(comparison.source)}" target="_blank" rel="noopener noreferrer">Published payments ↗</a>
  </section>`;
}

export function fundingView(jurisdiction, e) {
  const data = fundingByJurisdiction[jurisdiction];
  const initialRegion = jurisdiction === 'federal' ? 'qld' : jurisdiction;
  const initial = regionalEnrolment[initialRegion];
  return `<section class="readiness-funding" aria-labelledby="readiness-funding-title" data-funding-jurisdiction="${e(jurisdiction)}">
    <div class="panel readiness-calculator">
      <h2 id="readiness-funding-title" tabindex="-1">Explore election funding</h2>
      <p>Estimate how much public money a campaign could receive from its votes and spending. A “formal vote” is a ballot completed correctly enough to count. A “first preference” is the voter’s first choice. A “contest” is one election race, such as an electorate or an upper-house election. For one electorate, enter the number of people enrolled to vote there.</p>
      <form data-readiness-funding-form>
        <div class="readiness-calculator-fields">
          <label class="field">Funding rules<select name="scheme">${data.schemes.map((scheme, index) => `<option value="${index}">${e(scheme.label)}</option>`).join('')}</select></label>
          <label class="field">Use this area’s enrolled voters as a starting point<select name="region">${Object.entries(regionalEnrolment).map(([id, region]) => `<option value="${e(id)}"${id === initialRegion ? ' selected' : ''}>${e(region.name)} · ${whole.format(region.enrolled)}</option>`).join('')}</select></label>
          ${numberField('People enrolled to vote in your example', 'enrolled', { value: initial.enrolled, max: 30000000 })}
          ${numberField('Enrolled people expected to cast a valid vote (%)', 'formalPercent', { value: 90, max: 100, step: 0.1 })}
          ${numberField('Share of valid votes choosing you first (%)', 'voteShare', { value: 4, max: 100, step: 0.01 })}
          ${numberField('Campaign spending allowed under the funding rules (A$)', 'spend', { max: 1000000000, step: 0.01 })}
          <label class="field">Check the vote requirement<select name="scope"><option value="qualifying">Assume every included contest already qualifies</option><option value="single">Check the vote share for one contest</option></select></label>
          <label class="readiness-election-check" data-funding-elected hidden><input name="elected" type="checkbox"> The candidate won a seat in this contest</label>
          ${jurisdiction === 'federal' ? `<div data-funding-automatic>${numberField('AEC automatic payment for this recipient (A$, if known)', 'automatic', { max: 1000000, step: 0.01 })}</div>` : ''}
        </div>
        <p class="readiness-calculator-source" data-funding-scheme-note></p>
        <p class="readiness-calculator-source">The starting voter numbers are from the federal electoral roll, not a forecast for your election. Replace them with the number for your electorate or the contests you are adding together. The example assumes 90% of enrolled people cast a valid vote; you can change this. <a href="${enrolmentSource}" target="_blank" rel="noopener noreferrer">AEC voter numbers, 30 September 2026 ↗</a></p>
        <div class="readiness-estimates" aria-label="Funding scenario results">
          <div><span>Estimated valid votes cast</span><strong data-funding-value="formal">—</strong></div>
          <div><span>Votes choosing you first</span><strong data-funding-value="votes">—</strong></div>
          <div><span>Funding calculated from those votes</span><strong data-funding-value="ceiling">—</strong></div>
          <div><span>Estimated public payment</span><strong data-funding-value="public">—</strong></div>
        </div>
        <p data-funding-result-note class="readiness-calculator-source" role="status"></p>
        <details class="readiness-calculation-option">
          <summary>Explore voluntary contributions</summary>
          <p>Estimate donations from people who choose to contribute. These are separate from public funding. Check the federal, state or territory donation rules that apply before accepting money.</p>
          <div class="readiness-calculator-fields">
            ${numberField('Number of contributors', 'contributors', { value: 0, max: 30000000 })}
            ${numberField('Average donation (A$)', 'averageGift', { value: 0, max: 1000000, step: 0.01 })}
          </div>
          <p><strong data-funding-value="gifts">${money.format(0)}</strong> in possible voluntary donations</p>
        </details>
        ${administrationMarkup(data.administration, e)}
      </form>
    </div>
    ${comparisonsMarkup(data.comparison, e)}
  </section>`;
}

export function mountFundingCalculator(root) {
  const panel = root.querySelector('[data-funding-jurisdiction]');
  if (!panel) return;
  const data = fundingByJurisdiction[panel.dataset.fundingJurisdiction];
  const form = panel.querySelector('form');
  const fields = form.elements;
  root.querySelector('[data-funding-jump]').addEventListener('click', () => {
    const title = panel.querySelector('h2');
    title.focus({ preventScroll: true });
    title.scrollIntoView({ block: 'start' });
  });
  let previousScheme;
  const output = (key, value) => { form.querySelector(`[data-funding-value="${key}"]`).textContent = value; };
  const update = () => {
    const scheme = data.schemes[Number(fields.scheme.value)];
    fields.scope.querySelector('[value="qualifying"]').disabled = Boolean(scheme.singleOnly);
    fields.scope.querySelector('[value="single"]').disabled = Boolean(scheme.qualifyingOnly || scheme.kind === 'none');
    if (fields.scope.selectedOptions[0].disabled) fields.scope.value = scheme.singleOnly ? 'single' : 'qualifying';
    form.querySelector('[data-funding-elected]').hidden = !scheme.electedQualifies || fields.scope.value !== 'single';
    if (fields.automatic) form.querySelector('[data-funding-automatic]').hidden = scheme.automatic != null;
    fields.spend.disabled = scheme.kind !== 'reimbursement';
    const estimate = electionEstimate(scheme, { enrolled: fields.enrolled.value, formalPercent: fields.formalPercent.value,
      voteShare: fields.voteShare.value, scope: fields.scope.value, elected: fields.elected.checked,
      spend: fields.spend.value, automatic: fields.automatic?.value });
    output('formal', whole.format(estimate.formalVotes));
    output('votes', whole.format(estimate.votes));
    output('ceiling', money.format(estimate.voteValue));
    output('public', estimate.estimate === null ? 'Enter spending' : money.format(estimate.estimate));
    output('gifts', money.format(Math.floor(nonNegative(fields.contributors.value)) * nonNegative(fields.averageGift.value)));
    if (data.administration) output('admin', money.format(administrativeEstimate(data.administration, fields.house.value, fields.senate?.value)));
    if (scheme !== previousScheme) {
      const schemeNote = form.querySelector('[data-funding-scheme-note]');
      const source = form.ownerDocument.createElement('a');
      source.className = 'source-link';
      source.href = scheme.source;
      source.target = '_blank';
      source.rel = 'noopener noreferrer';
      source.textContent = 'Funding rules ↗';
      schemeNote.replaceChildren(`${scheme.note} `, source);
      previousScheme = scheme;
    }
    let resultNote = '';
    if (!estimate.supported) resultNote = 'There is no public payment towards election campaign costs here.';
    else if (!estimate.qualified) resultNote = 'These numbers do not meet this funding scheme’s vote requirement or its alternative of winning a seat, where that applies.';
    else if (fields.scope.value === 'qualifying') resultNote = 'This estimate assumes every contest you included already meets the funding rules. Check each contest separately before adding its votes.';
    else resultNote = `Your first-choice votes are ${estimate.share.toFixed(2)}% of all valid votes in this example. Check the remaining rules for claiming payment with the electoral commission.`;
    if (estimate.qualified && scheme.partyAdjustment) resultNote += ' For parties, this estimate is before adjustments calculated across the whole party and subtraction of any payments received in advance.';
    const status = form.querySelector('[data-funding-result-note]');
    if (status.textContent !== resultNote) status.textContent = resultNote;
  };
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', event => {
    if (event.target === fields.region) fields.enrolled.value = regionalEnrolment[fields.region.value].enrolled;
    update();
  });
  update();
}
