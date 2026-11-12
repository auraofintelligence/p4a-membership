const stages = [
  ['Secure your account', 'Confirm that you control the contact address you use to sign in. Keep your sign-in details private.'],
  ['Verify your identity', 'Use the approved private process when it opens. Ask for an accessible or assisted option if you need one.'],
  ['Check eligibility', 'Review the requirements for the organisation you want to join. Electoral enrolment and other criteria depend on the organisation and jurisdiction.'],
  ['Practise civic judgement', 'Work through scenarios on the movement’s purpose, checking evidence, correcting mistakes, respectful disagreement, conflicts of interest, privacy and responsibility.'],
  ['Read the terms and choose what to share', 'Read the published terms, conduct standards and privacy notice when they are available. Make a separate choice about each optional public disclosure.'],
  ['Receive an independent review', 'A reviewer other than the applicant checks the record and explains the outcome. Ask how to correct a misunderstanding or request a fresh review.'],
];

const statusLabels = new Map([
  ['draft', 'Draft'],
  ['submitted', 'Awaiting independent review'],
  ['changes-requested', 'Changes requested'],
  ['ready-for-checks', 'Ready for further checks'],
  ['withdrawn', 'Withdrawn'],
]);

const dateFormat = new Intl.DateTimeFormat('en-AU', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Australia/Brisbane',
});

function dateLabel(value, e) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? `<time datetime="${e(value)}">${dateFormat.format(time)}</time>` : '';
}

function policyField(policyVersion, e) {
  return `<input type="hidden" name="policyVersion" value="${e(policyVersion)}">`;
}

function answerFor(item, question) {
  return Object.hasOwn(item.answers || {}, question.id) ? item.answers[question.id] : undefined;
}

function answersList(item, questions, e) {
  return `<dl class="onboarding-answers">${questions.map(question => {
    const option = question.options.find(choice => choice.id === answerFor(item, question));
    return `<div><dt>${e(question.prompt)}</dt><dd>${e(option?.label || 'Answer unavailable')}</dd></div>`;
  }).join('')}</dl>`;
}

function history(item, e) {
  if (!item.reviews?.length) return '';
  return `<section class="onboarding-history" aria-label="Review history"><h3>Review history</h3><ol>${item.reviews.map(review => `
    <li><strong>${e(statusLabels.get(review.outcome) || 'Review recorded')}</strong> ${dateLabel(review.reviewedAt, e)}
      <p>${e(review.reason)}</p></li>`).join('')}</ol></section>`;
}

function startForm(policyVersion, e) {
  return `<form method="post" class="onboarding-form" data-form="onboarding-start">
    ${policyField(policyVersion, e)}
    <label class="check-field"><input type="checkbox" name="acknowledged" required><span>I understand this is a fictional practice application. P4A is a movement in formation, and this exercise does not create membership.</span></label>
    <p class="form-error" role="alert"></p>
    <button type="submit" class="button">Start a practice application</button>
  </form>`;
}

function scenariosForm(item, policy, e) {
  return `<form method="post" class="onboarding-form" data-form="onboarding-submit" data-id="${e(item.id)}">
    ${policyField(policy.policyVersion, e)}
    <h3>Work through the scenarios</h3>
    <p>Choose one answer in each scenario and send your choices to a fictional reviewer.</p>
    <div class="onboarding-questions">${policy.questions.map(question => `<fieldset>
      <legend>${e(question.prompt)}</legend>
      ${question.options.map(option => `<label class="check-field"><input type="radio" name="answer.${e(question.id)}" value="${e(option.id)}" required${answerFor(item, question) === option.id ? ' checked' : ''}><span>${e(option.label)}</span></label>`).join('')}
    </fieldset>`).join('')}</div>
    <p class="form-error" role="alert"></p>
    <button type="submit" class="button">Submit for practice review</button>
  </form>`;
}

function applicantPanel(state, policy, e) {
  if (!state.actor) {
    return `<section class="panel wide-panel onboarding-status"><h2>Try the fictional application</h2>
      <p>Choose a demo role to see what an applicant or a reviewer would do.</p>
      <div class="button-row subheading"><button type="button" class="button" data-action="demo-member">Try as an applicant</button><a class="button secondary" href="#onboarding/review">Open the review exercise</a></div></section>`;
  }

  const item = policy.cases.findLast(entry => entry.personId === state.actor.id);
  const active = item && item.status !== 'withdrawn';
  const reviewLink = '<p><a href="#onboarding/review">Open the practice review queue →</a></p>';
  if (!active) {
    return `<section class="panel wide-panel onboarding-status"><h2>Your practice application</h2>
      ${item ? '<p>Your last practice application was withdrawn. You can start another exercise.</p>' : '<p>Read the acknowledgement, then work through the scenarios and ask for a practice review.</p>'}
      ${item ? history(item, e) : ''}
      ${startForm(policy.policyVersion, e)}${reviewLink}</section>`;
  }

  const editable = ['draft', 'changes-requested'].includes(item.status);
  const currentPolicy = item.policyVersion === policy.policyVersion;
  const statusCopy = item.status === 'ready-for-checks' ? 'The reviewer recorded readiness for further checks. The exercise ends here.'
    : item.status === 'submitted' ? 'A fictional organiser can now review your answers.' : '';
  return `<section class="panel wide-panel onboarding-status"><div class="section-heading"><h2>Your practice application</h2><span class="chip">${e(statusLabels.get(item.status))}</span></div>
    ${statusCopy ? `<p>${statusCopy}</p>` : ''}
    ${history(item, e)}
    ${editable && currentPolicy ? scenariosForm(item, policy, e) : editable
      ? '<p>This practice application uses earlier questions. Withdraw it and start again to use the current questions.</p>'
      : answersList(item, policy.questions, e)}
    <form method="post" class="onboarding-form" data-form="onboarding-withdraw" data-id="${e(item.id)}">
      <p class="form-error" role="alert"></p><button type="submit" class="button secondary">Withdraw practice application</button>
    </form>${reviewLink}
  </section>`;
}

function reviewForm(item, e) {
  return `<form method="post" class="onboarding-form" data-form="onboarding-review" data-id="${e(item.id)}">
    <label class="field">Practice review outcome<select name="outcome" required>
      <option value="" selected disabled>Choose an outcome</option>
      <option value="ready-for-checks">Ready for further checks</option>
      <option value="changes-requested">Request changes</option>
    </select></label>
    <label class="field">Reason and next step<textarea name="reason" required maxlength="1000" rows="3"></textarea><small>Write feedback the fictional applicant can act on. Use sample details only.</small></label>
    <p class="form-error" role="alert"></p>
    <button type="submit" class="button">Record practice review</button>
  </form>`;
}

function reviewPanel(state, policy, e) {
  if (state.actor?.role !== 'organiser') {
    return `<section class="panel wide-panel onboarding-status"><h2>Practise independent review</h2>
      <p>Use the fictional organiser role to review submitted practice applications. Use a different person for the applicant and reviewer.</p>
      <button type="button" class="button subheading" data-action="demo-organiser">Try as a reviewer</button></section>`;
  }

  const pending = policy.cases.filter(item => item.status === 'submitted');
  return `<section class="panel wide-panel onboarding-status"><h2>Submitted practice applications</h2>
    <p>Read the responses and explain the next step. This practice decision records readiness for further checks or asks for changes.</p>
    ${pending.length ? `<ul class="onboarding-review-list">${pending.map(item => {
      const applicant = state.people?.find(person => person.id === item.personId)?.name || 'Fictional applicant';
      const review = item.personId === state.actor.id ? '<p>Another organiser must review your application.</p>'
        : item.policyVersion !== policy.policyVersion ? '<p>Ask the applicant to start again with the current questions.</p>'
        : `${answersList(item, policy.questions, e)}${history(item, e)}${reviewForm(item, e)}`;
      return `<li><h3>${e(applicant)}</h3><p>Submitted ${dateLabel(item.submittedAt || item.createdAt, e)}</p>${review}</li>`;
    }).join('')}</ul>` : '<p class="subheading">No practice applications are awaiting review.</p>'}
    <p class="subheading"><a href="#onboarding">Back to membership onboarding →</a></p>
  </section>`;
}

function liveGuidance(pilot, organiser) {
  return `<section class="panel wide-panel onboarding-status"><h2>Where things stand</h2>
    <p>${pilot ? 'Your invitation opens the private workspace and civic training. Membership applications are awaiting opening.' : 'P4A is a movement in formation. Membership applications and real admission checks are awaiting opening.'}</p>
    ${pilot ? `<div class="button-row subheading"><a class="button" href="#training/member-induction">Start member induction</a>${organiser ? '<a class="button secondary" href="#onboarding/applications">Review membership applications</a>' : ''}</div><p>Use the lessons to prepare for a conversation with a reviewer.</p>` : '<p>Explore public resources and the constitution workbench while the admission arrangements are developed.</p>'}
  </section>`;
}

export function onboardingView(state, id, { e, heading, icon, civicTools = false }) {
  const pilot = state.mode === 'pilot';
  const policy = state.onboarding;
  const demo = state.mode === 'demo' && !state.preview && policy?.enabled === true;
  const review = demo && id === 'review';
  const applicationPath = state.mode === 'demo' ? './apply/' : 'https://auraofintelligence.github.io/p4a-membership/apply/';
  const title = review ? 'Practice review queue' : 'Membership onboarding';
  const intro = review ? 'Practise explaining a review decision and giving someone a fair next step.' : 'See how account access, civic learning and independent review fit together.';
  return `<div class="onboarding-page">
    ${heading('Taking part in P4A', title, intro)}
    ${review ? '' : `<div class="button-row subheading">
      <a class="button" href="${applicationPath}">Read the membership guide</a>
      <a class="button secondary" href="${applicationPath}application.html">View the application form</a>
      ${demo && state.actor?.role === 'organiser' ? '<a class="button secondary" href="#onboarding/applications">Open sample applications</a>' : ''}
    </div>`}
    ${demo ? '<p class="callout"><strong>Fictional exercise.</strong> Use the sample profiles and answers. Keep real identity documents, payment details and personal information out of this exercise.</p>' : ''}
    ${review ? reviewPanel(state, policy, e) : demo ? applicantPanel(state, policy, e) : liveGuidance(pilot, state.actor?.role === 'organiser')}
    ${review ? '' : `<section class="panel wide-panel onboarding-steps" aria-labelledby="onboarding-steps-heading">
      <div class="section-heading"><h2 id="onboarding-steps-heading">Steps for real membership</h2>${icon('onboarding')}</div>
      <ol>${stages.map(([name, detail]) => `<li><h3>${e(name)}</h3><p>${e(detail)}</p></li>`).join('')}</ol>
      <h3>Political work and team induction</h3>
      <p>Members work on policy, outreach and building and running party systems. Team games are one part of induction. Plan for one half-day or full-day session in your first three months, or an informal evening format held at most once a month. Political meetings run separately.</p>
      <p>After the first check-in, record each game from start to finish with video, audio and screen capture as suited to the game. Review the footage to see how the team works, which roles suit people and what skills they can share.</p>
      <p>Keep building skills together after induction. In Gamify Democracy you can track your participation and suggest new activities for members to try.</p>
      <div class="button-row subheading"><a class="button secondary" href="#gamify/games">Browse the team games index</a>${civicTools ? '<a class="button quiet" href="#training/first-quarter-team-games">Open the first-quarter team games lesson →</a>' : ''}</div>
      <h3 class="subheading">Membership payments</h3>
      <p>After the initial eligibility review, pay a one-off application fee of at least A$5 for assessment and verification costs. On approval, pay one quarter of the annual fee for your first three months. At the end of those three months, choose whether to renew for a full year at the annual fee. You’ll see the amount, what it covers and the terms before each payment.</p>
      <p class="subheading">You can take part in public civic work, explore the ideas and learn at your own pace while the membership process is being developed.</p>
      <div class="button-row subheading"><a class="button secondary" href="#resources">Explore public resources</a><a class="button secondary" href="https://p4a.xyz/pages/constitution.html" target="_blank" rel="noopener noreferrer">Open the public constitution workbench ↗</a></div>
    </section>`}
  </div>`;
}
