const labels = {
  received: 'Received',
  contacted: 'Contacted',
  'verification-pending': 'Verification pending',
  closed: 'Closed',
};
const transitions = {
  received: ['contacted', 'closed'],
  contacted: ['verification-pending', 'closed'],
  'verification-pending': ['closed'],
  closed: [],
};
const dates = new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Australia/Brisbane' });
const enrolmentLabels = {
  enrolled: 'Enrolled',
  'not-enrolled': 'Not currently enrolled',
  unsure: 'Unsure',
};

function statusForm(record, e) {
  const next = transitions[record.status] || [];
  if (!next.length) return '';
  return `<form class="onboarding-form" data-application-review data-id="${e(record.id)}" data-status="${e(record.status)}">
    <label class="field">Next stage<select name="status" required><option value="" disabled selected>Choose a stage</option>
      ${next.map(status => `<option value="${status}">${labels[status]}</option>`).join('')}</select></label>
    <label class="field">Reason<textarea name="reason" required maxlength="500" rows="2"></textarea><small>Record the reason without including identity documents or sensitive details.</small></label>
    <p class="form-error" role="alert"></p>
    <button class="button secondary" type="submit">Record stage</button>
  </form>`;
}

function recordCard(record, e) {
  const submittedAt = new Date(record.submittedAt);
  const submitted = Number.isNaN(submittedAt.getTime()) ? '' : dates.format(submittedAt);
  const jurisdiction = record.jurisdiction === 'outside' ? 'Outside Australia' : record.jurisdiction?.toUpperCase();
  const contact = [record.email, record.contactPhone].filter(Boolean).map(e).join(' · ');
  const location = [record.localArea, jurisdiction].filter(Boolean).map(e).join(' · ');
  const enrolment = enrolmentLabels[record.electoralEnrolment];
  const suggestedGames = record.suggestedGames?.split('\n').filter(Boolean) ?? [];
  return `<li><div class="section-heading"><h3>${e(record.name)}</h3><span class="chip">${e(labels[record.status] || record.status)}</span></div>
    <p>${contact}</p><p>${location}</p>
    ${enrolment ? `<p>Declared electoral enrolment · ${e(enrolment)}</p>` : ''}
    <p>Submitted ${e(submitted)} Brisbane time</p>
    ${record.membershipIntent ? `<div class="subheading"><h4>What they’d like to work on</h4><p class="application-intent">${e(record.membershipIntent)}</p></div>` : ''}
    ${suggestedGames.length ? `<div class="subheading"><h4>Games they’d bring</h4><ul>${suggestedGames.map(game => `<li>${e(game)}</li>`).join('')}</ul></div>` : ''}
    ${statusForm(record, e)}</li>`;
}

export function applicationReviewView({ heading }) {
  return `<div class="onboarding-page">
    ${heading('Membership onboarding', 'Membership applications', 'Review applications and record when you contact someone or refer them for further checks.')}
    <a href="#onboarding" class="back-link">← Membership onboarding</a>
    <section class="panel wide-panel onboarding-status" data-applications>
      <h2>Applications register</h2>
      <p>Contact applicants through the approved process. Use their interests and game suggestions to plan how they can take part.</p>
      <label class="field subheading">Show applications
        <select data-application-filter>
          <option value="">All open</option>
          ${Object.entries(labels).map(([status, label]) => `<option value="${status}">${label}</option>`).join('')}
        </select>
      </label>
      <p class="subheading" data-application-message role="status" aria-atomic="true"></p>
      <ul class="onboarding-review-list" data-application-records></ul>
    </section>
  </div>`;
}

export function mountApplicationReview(panel, { api, e }) {
  const list = panel.querySelector('[data-application-records]');
  const message = panel.querySelector('[data-application-message]');
  const filter = panel.querySelector('[data-application-filter]');
  let requestNumber = 0;
  async function load(success = '') {
    const currentRequest = ++requestNumber;
    list.replaceChildren();
    message.textContent = 'Loading applications…';
    try {
      const query = filter.value ? `?status=${encodeURIComponent(filter.value)}` : '';
      const { records } = await api(`/api/applications${query}`);
      if (currentRequest !== requestNumber) return;
      list.innerHTML = records.map(record => recordCard(record, e)).join('');
      const summary = records.length === 100 ? 'Showing the first 100 matches.' : `${records.length} matching applications.`;
      message.textContent = [success, summary].filter(Boolean).join(' ');
    } catch (error) {
      if (currentRequest === requestNumber) message.textContent = error.message;
    }
  }
  filter.addEventListener('change', () => void load());
  panel.addEventListener('submit', async event => {
    const form = event.target.closest('form[data-application-review]');
    if (!form) return;
    event.preventDefault();
    const fields = new FormData(form);
    const button = form.querySelector('button');
    const errorMessage = form.querySelector('.form-error');
    errorMessage.textContent = '';
    button.disabled = true;
    try {
      await api('/api/applications', { method: 'POST', body: JSON.stringify({
        id: form.dataset.id,
        expectedStatus: form.dataset.status,
        status: fields.get('status'),
        reason: fields.get('reason'),
      }) });
      await load('Application stage recorded.');
      message.tabIndex = -1;
      message.focus();
    } catch (error) {
      errorMessage.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
  void load();
}
