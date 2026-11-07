// Public recognition is loaded from the server's allowlisted projection.
// Private receipts come only from the actor-scoped workspace bootstrap.
let board = null;
let boardError = '';
let requestVersion = 0;
const filters = { period: 'all', groupId: '', projectId: '' };
let privateKind = 'money';
let privateStatus = 'all';
const categories = { donation: 'Donation', sponsorship: 'Sponsorship', 'project-funding': 'Project funding' };
const money = cents => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(Number(cents || 0) / 100);
const hours = value => new Intl.NumberFormat('en-AU', { maximumFractionDigits: 2 }).format(Number(value || 0));
const own = (record, state) => record.personId === state.actor?.id;
const organiser = state => state.actor?.role === 'organiser';
const independent = (record, state) => organiser(state) && !own(record, state) && record.createdBy !== state.actor.id;
const net = record => record.netCents ?? record.amountCents - (record.refundedCents ?? (record.refunds || []).reduce((sum, item) => sum + item.amountCents, 0));
const getReceipt = (state, kind, id) => (kind === 'money' ? state.financialContributions || [] : state.contributions || []).find(item => item.id === id);
const tone = status => status === 'verified' ? 'green' : status === 'pending' ? 'orange' : 'gray';

export async function loadGamify(api) {
  const version = ++requestVersion;
  const query = new URLSearchParams(filters);
  try {
    const result = await api(`/api/gamify?${query}`);
    if (version !== requestVersion) return false;
    board = result;
    boardError = '';
    return true;
  } catch (error) {
    if (version !== requestVersion) return false;
    board = null;
    boardError = error.message || 'The contribution boards could not be loaded.';
    return true;
  }
}

function filtersView(h) {
  const { e } = h;
  const groups = board?.options?.groups || [];
  const projects = (board?.options?.projects || []).filter(project => !filters.groupId || project.groupId === filters.groupId);
  return `<section class="gamify-filters" aria-label="Leaderboard filters">
    <label class="field" for="gamify-period">Reporting period<select id="gamify-period" data-gamify-filter="period"><option value="all" ${filters.period === 'all' ? 'selected' : ''}>All time</option><option value="year" ${filters.period === 'year' ? 'selected' : ''}>This calendar year${board?.year ? ` · ${e(board.year)}` : ''}</option></select></label>
    <label class="field" for="gamify-group">Working group<select id="gamify-group" data-gamify-filter="groupId" ${groups.length ? '' : 'disabled'}><option value="">All working groups</option>${groups.map(group => `<option value="${e(group.id)}" ${filters.groupId === group.id ? 'selected' : ''}>${e(group.name)}</option>`).join('')}</select>${groups.length ? '' : '<small>No working groups are publicly listed yet.</small>'}</label>
    <label class="field" for="gamify-project">Project<select id="gamify-project" data-gamify-filter="projectId"><option value="">All public projects</option>${projects.map(project => `<option value="${e(project.id)}" ${filters.projectId === project.id ? 'selected' : ''}>${e(project.title)}</option>`).join('')}</select></label>
    ${h.actionButton('Reset filters', 'gamify-reset', '', 'quiet small')}
  </section>`;
}

function ranking(kind, h) {
  const { e } = h;
  const isMoney = kind === 'money';
  const rows = board?.[kind] || [];
  const total = isMoney ? money(board?.totals?.moneyCents) : `${hours(board?.totals?.hours)} h`;
  const count = isMoney ? board?.totals?.moneyReceipts || 0 : board?.totals?.hourReceipts || 0;
  const namedTotal = rows.reduce((sum, item) => sum + Number(isMoney ? item.totalCents : item.totalHours), 0);
  return `<section class="gamify-board gamify-board-${kind}" aria-labelledby="gamify-${kind}-heading">
    <div class="gamify-board-heading"><div><span class="eyebrow">${isMoney ? 'Monetary contribution · AUD' : 'Voluntary contribution · C-Hours'}</span><h2 id="gamify-${kind}-heading">${isMoney ? 'Funding shared work' : 'Giving time freely'}</h2></div><span class="gamify-unit" aria-hidden="true">${isMoney ? '$' : 'h'}</span></div>
    <div class="gamify-board-total"><strong>${total}</strong><span>Verified and shared in this view<small>${count} receipt${count === 1 ? '' : 's'} · includes aggregate-only choices</small></span></div>
    <div class="gamify-board-label"><h3>Named recognition</h3><span>${rows.length} contributor${rows.length === 1 ? '' : 's'}</span></div>
    ${rows.length ? `<ol class="gamify-ranks" aria-label="${isMoney ? 'Monetary' : 'Voluntary'} contribution leaderboard">${rows.map(row => `<li class="gamify-rank-row"><span class="gamify-rank" aria-label="Rank ${e(row.rank)}">${e(row.rank)}</span><div class="gamify-rank-person"><strong>${e(row.name)}</strong><details><summary>${row.receiptCount} verified receipt${row.receiptCount === 1 ? '' : 's'} · see projects</summary><ul>${(row.projects || []).map(project => `<li><a href="#project/${e(project.id)}">${e(project.title)}</a><span>${isMoney ? money(project.totalCents) : `${hours(project.totalHours)} h`}</span></li>`).join('')}</ul></details></div><strong class="gamify-rank-value">${isMoney ? money(row.totalCents) : `${hours(row.totalHours)} h`}</strong></li>`).join('')}</ol>` : `<div class="gamify-board-empty"><strong>Recognition starts with a choice.</strong><p>No verified receipts in this view have permission for named recognition yet. Contributors can share their name from their receipt’s visibility choices.</p></div>`}
    <div class="gamify-board-foot"><span>Named total: <strong>${isMoney ? money(namedTotal) : `${hours(namedTotal)} h`}</strong></span><span>${isMoney ? 'Original amount less recorded refunds' : 'One verified human hour, counted once'}</span></div>
  </section>`;
}

function projectContext(h) {
  const { e, tag } = h;
  const projects = (board?.options?.projects || []).filter(project => (!filters.groupId || project.groupId === filters.groupId) && (!filters.projectId || project.id === filters.projectId));
  if (!projects.length) return '';
  return `<section class="gamify-project-context"><div class="section-heading"><div><span class="eyebrow">Follow the work</span><h2>Projects behind the contributions</h2></div><a href="#projects">Explore shared work →</a></div><div class="gamify-project-links">${projects.map(project => `<a class="gamify-project-link" href="#project/${e(project.id)}"><span>${e(project.title)}</span>${tag(project.status || 'proposed', tone(project.status))}<span aria-hidden="true">↗</span></a>`).join('')}</div><p class="metric-explainer">Project stages describe the work’s current position. Contribution totals do not by themselves establish an outcome.</p></section>`;
}

function methodology(h) {
  return `<details class="gamify-method"><summary>How recognition is calculated</summary><div class="gamify-method-body"><p>Boards include independently verified receipts for public projects, filtered by the contribution date and the selected working group or project. Calendar-year views use Australia/Brisbane dates.</p><p><strong>Money:</strong> donations, sponsorship and project funding are recorded in AUD. Recognition uses the original receipt amount less recorded refunds. Refunds update the original receipt’s reporting period. Payment fees do not reduce a contributor’s recognised amount. Internal allocations, token purchases, market gains and paid work do not create additional donations.</p><p><strong>Time:</strong> freely given human hours retain their own unit. Paid shifts and machine processing time are not C-Hours. Money and hours are never combined into a single score.</p><p><strong>Ranking:</strong> totals run from highest to lowest. Equal totals receive the same rank, with the following rank reflecting the number of preceding people: 1, 1, 3. Named recognition and aggregate publication require the contributor’s choices. A named receipt also contributes to the displayed public total.</p><p><strong>Corrections:</strong> a corrected receipt returns to independent review; revoked receipts stop counting. Named recognition can be withdrawn without erasing the private audit record. Contributors can correct their own receipts; organisers can record a reasoned revocation or refund.</p><p>These are contribution records, not identity-verification or ZKP credentials. Recognition does not assign political authority. <a href="#constitution">Shape the governing rules in the constitution workbench →</a></p></div></details>`;
}

function historyView(record, h) {
  const history = record.history || [];
  const refunds = record.refunds || [];
  if (!history.length && !refunds.length && !record.reviewReason) return '';
  return `<details class="gamify-receipt-history"><summary>Review and correction record</summary>${record.reviewReason ? `<p><strong>Review:</strong> ${h.e(record.reviewReason)}</p>` : ''}${refunds.map(refund => `<p><strong>Refund ${money(refund.amountCents)}</strong> · ${h.dateText(refund.at || refund.createdAt)}<br>${h.e(refund.reason)}<br><small>Private reference: ${h.e(refund.reference)}</small></p>`).join('')}${history.map(item => `<p><strong>${h.e(item.type || item.action || 'Receipt updated')}</strong> · ${h.dateText(item.at || item.changedAt)}${item.reason ? `<br>${h.e(item.reason)}` : ''}</p>`).join('')}</details>`;
}

function receiptCard(record, kind, state, h) {
  const { e, tag, actionButton, dateText } = h;
  const isMoney = kind === 'money';
  const publicProject = state.projects.some(project => project.id === record.projectId && project.public === true) || (board?.options?.projects || []).some(project => project.id === record.projectId);
  const project = state.projects.find(item => item.id === record.projectId);
  const name = state.people.find(person => person.id === record.personId)?.name || (own(record, state) ? state.actor.name : 'Contributor');
  const canReview = independent(record, state);
  const canCorrect = own(record, state) || (isMoney && record.createdBy === state.actor.id);
  const canRefund = isMoney && canReview && record.status === 'verified' && net(record) > 0;
  const amount = isMoney ? money(net(record)) : `${hours(record.hours)} h`;
  return `<article class="gamify-receipt"><div class="gamify-receipt-head"><div><span class="gamify-receipt-kind">${isMoney ? e(categories[record.category] || record.category) : 'Voluntary time'} · ${dateText(record.date)}</span><h3>${e(project?.title || 'Project record')}</h3><p>${e(name)}</p></div><div class="gamify-receipt-amount"><strong>${amount}</strong>${tag(record.status, tone(record.status))}</div></div><p class="gamify-receipt-description">${e(record.description)}</p>${isMoney ? `<div class="gamify-receipt-reference"><span>Private reference</span><code>${e(record.reference)}</code>${record.refundedCents ? `<small>Original ${money(record.amountCents)} · Refunded ${money(record.refundedCents)}</small>` : ''}</div>` : ''}<div class="gamify-visibility"><span>${record.namedConsent ? 'Named recognition chosen' : record.publicConsent ? 'Aggregate only' : 'Private contribution'}</span>${record.namedConsent && record.publicConsent ? '<span>Aggregate sharing also chosen</span>' : ''}${!publicProject ? '<span>Project not publicly listed · excluded from Gamify boards</span>' : record.status !== 'verified' ? '<span>Not counted until independently verified</span>' : ''}</div><div class="button-row">${own(record, state) ? actionButton('Visibility choices', `gamify-${kind}-sharing`, record.id, 'secondary small') : ''}${record.status === 'pending' && canReview ? actionButton('Review receipt', `gamify-${kind}-review`, record.id, 'small') : ''}${canCorrect && !(isMoney && record.refundedCents) ? actionButton('Correct receipt', `gamify-${kind}-correct`, record.id, 'secondary small') : ''}${canRefund ? actionButton('Record a refund', 'gamify-money-refund', record.id, 'secondary small') : ''}${record.status === 'verified' && canReview ? actionButton('Revoke verification', `gamify-${kind}-revoke`, record.id, 'quiet small') : ''}</div>${historyView(record, h)}</article>`;
}

function privateWorkspace(state, h) {
  if (!state.actor) return `<section class="gamify-public-invite panel"><h2>Your contribution. Your choice.</h2><p>Members can record time and financial receipts, follow independent review and decide whether their name appears here.</p><a class="button secondary" href="#profile">Explore membership</a></section>`;
  const moneyReceipts = state.financialContributions || [];
  const timeReceipts = state.contributions || [];
  const records = (privateKind === 'money' ? moneyReceipts : timeReceipts).filter(record => privateStatus === 'all' || record.status === privateStatus).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.createdAt).localeCompare(String(a.createdAt)));
  return `<section class="gamify-private" aria-labelledby="gamify-private-heading"><div class="section-heading"><div><span class="eyebrow">${organiser(state) ? 'Organiser workspace · restricted records' : 'Your private contribution workspace'}</span><h2 id="gamify-private-heading">${organiser(state) ? 'Receipts, review and recognition' : 'Choose what your contribution shares'}</h2></div><div class="button-row">${h.actionButton('Record money received', 'gamify-money-new', '', 'secondary')}${h.actionButton('Record voluntary time', 'log-hours', '', '')}</div></div><p class="gamify-private-intro">${state.mode === 'demo' ? 'These are fictional local review records. Recording a receipt does not collect or transfer money.' : 'Record keeping only. Online payments and crypto conversion are not connected.'} ${organiser(state) ? 'Another organiser must review receipts you created or contributed.' : 'Another person must verify a receipt before it can count.'}</p><div class="gamify-private-toolbar"><div class="gamify-tabs" role="group" aria-label="Receipt category">${h.actionButton(`Money (${moneyReceipts.length})`, 'gamify-kind', 'money', privateKind === 'money' ? '' : 'secondary', `aria-pressed="${privateKind === 'money'}"`)}${h.actionButton(`Voluntary time (${timeReceipts.length})`, 'gamify-kind', 'hours', privateKind === 'hours' ? '' : 'secondary', `aria-pressed="${privateKind === 'hours'}"`)}</div><label class="field" for="gamify-status">Receipt status<select id="gamify-status"><option value="all">All statuses</option>${['pending', 'verified', 'rejected', 'revoked'].map(status => `<option value="${status}" ${privateStatus === status ? 'selected' : ''}>${status[0].toUpperCase() + status.slice(1)}</option>`).join('')}</select></label></div><div class="gamify-receipts">${records.map(record => receiptCard(record, privateKind, state, h)).join('') || `<div class="gamify-empty-private"><h3>${privateStatus === 'all' ? 'A clear record starts here.' : 'No receipts with this status.'}</h3><p>${privateKind === 'money' ? 'Record a financial contribution and its private receipt reference for independent review.' : 'Record freely given human time and keep the project context with it.'}</p></div>`}</div></section>`;
}

export function gamifyView(state, h) {
  const { e, heading, actionButton } = h;
  const group = board?.options?.groups?.find(item => item.id === filters.groupId);
  const project = board?.options?.projects?.find(item => item.id === filters.projectId);
  const scope = [filters.period === 'year' ? `Calendar year ${board?.year || ''}` : 'All time', group?.name || 'All working groups', project?.title || 'All public projects'].join(' · ');
  return `<div class="gamify-page">${heading('Participation worth recognising', 'Gamify Democracy', 'See the people funding shared work, the people giving their time, and the projects they help make possible.', state.actor ? `<div class="button-row gamify-heading-actions">${actionButton('Record money received', 'gamify-money-new', '', 'secondary')}${actionButton('Record voluntary time', 'log-hours', '', '')}</div>` : '')}<div class="gamify-intro"><p><strong>Two ways to contribute. Each with its own measure.</strong> Verified receipts connect recognition to real work. Contributors choose whether their name appears.</p><div class="gamify-intro-actions">${actionButton('Read the method ↓', 'gamify-method', '', 'quiet small')}${actionButton('Refresh boards', 'gamify-retry', '', 'quiet small')}</div></div>${filtersView(h)}${boardError ? `<section class="panel gamify-load-error" role="alert"><h2>Contribution boards are unavailable</h2><p>${e(boardError)}</p><div class="button-row">${actionButton('Try again', 'gamify-retry', '', 'secondary')}${actionButton('Clear filters and retry', 'gamify-reset', '', 'quiet')}</div></section>` : board ? `<div class="gamify-scope"><p>${e(scope)}</p><span>Calculated ${e(board.updatedAt ? new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Australia/Brisbane' }).format(new Date(board.updatedAt)) : 'with the current records')} · Brisbane</span></div><div class="gamify-boards">${ranking('money', h)}${ranking('hours', h)}</div>${projectContext(h)}` : '<p class="panel" role="status">Loading verified contribution records…</p>'}<div id="gamify-methodology">${methodology(h)}</div>${privateWorkspace(state, h)}</div>`;
}

function eligibleFinancialProjects(state, record = null) {
  return (state.projects || []).filter(project => organiser(state) || project.id === record?.projectId || state.groups.some(group => group.id === project.groupId && group.memberIds?.includes(state.actor?.id)));
}

function receiptFields(record, state, h, { correcting = false } = {}) {
  const { e, field } = h;
  const available = eligibleFinancialProjects(state, record);
  return `<label class="field full">Project<select name="projectId" required>${available.map(project => `<option value="${e(project.id)}" ${record?.projectId === project.id ? 'selected' : ''}>${e(project.title)}${project.public === false ? ' · private project' : ''}</option>`).join('')}</select><small>Public recognition is available only for publicly listed projects.</small></label>${field('Date received', 'date', record?.date || h.today(), { type: 'date', required: true, max: h.today() })}<label class="field">Amount received (AUD)<input type="number" name="amount" min="0.01" max="10000000" step="0.01" value="${record ? (record.amountCents / 100).toFixed(2) : ''}" required></label><label class="field">Receipt category<select name="category">${Object.entries(categories).map(([value, label]) => `<option value="${value}" ${record?.category === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label>${field('Private payment reference', 'reference', record?.reference || '', { required: true, length: 120 })}<label class="field full">Purpose and receipt context<textarea name="description" maxlength="1000" required>${e(record?.description || '')}</textarea><small>Keep identity documents and banking credentials out of this record.</small></label>${correcting ? reasonField(h, 'Why does this receipt need correcting?') : '<p class="gamify-form-note field full">New receipts begin private and awaiting independent review. After saving, you can preview and choose public visibility separately.</p>'}`;
}

function reasonField(h, label = 'Reason for this decision') {
  return `<label class="field full">${h.e(label)}<textarea name="reason" maxlength="1000" required></textarea><small>This explanation stays with the private review history.</small></label>`;
}

function sharingDialog(record, kind, state, h) {
  const { e } = h;
  const publicProject = state.projects.some(project => project.id === record.projectId && project.public === true) || board?.options?.projects?.some(project => project.id === record.projectId);
  const project = state.projects.find(item => item.id === record.projectId);
  const amount = kind === 'money' ? money(net(record)) : `${hours(record.hours)} C-Hours`;
  const body = `<div class="gamify-sharing-summary field full"><strong>${e(project?.title || 'Project record')}</strong><span>${amount} · ${h.dateText(record.date)} · ${e(record.status)}</span></div><label class="check-field field full"><input type="checkbox" name="publicConsent" ${record.publicConsent ? 'checked' : ''}><span>Include this receipt in public totals without my name.<small>Anyone can filter totals by reporting period, project and working group. Small groups or other information may make a contribution recognisable.</small></span></label><label class="check-field field full"><input type="checkbox" name="namedConsent" data-gamify-named ${record.namedConsent && publicProject ? 'checked' : ''} ${publicProject ? '' : 'disabled'}><span>Include my name and this contribution in the public leaderboard.<small>This also includes the receipt in public totals. It is separate from directory, contact and membership visibility.</small></span></label><div class="gamify-public-preview field full" data-gamify-preview ${record.namedConsent && publicProject ? '' : 'hidden'}><span class="eyebrow">What named recognition reveals</span><strong>${e(state.actor.name)}</strong><span>${amount} toward ${e(project?.title || 'this project')}</span><p>Your name, eligible contribution total, receipt count and project breakdown can appear publicly. This receipt can affect totals and rank in its reporting period and working group. Other receipts you share by name are added under the same name. No private reference or description is published.</p></div>${!publicProject ? `<p class="gamify-form-note field full">This project is not publicly listed, so its receipts are excluded from Gamify boards. Named recognition becomes available when the project is public. ${kind === 'hours' ? 'If you choose aggregate sharing, verified time can still count in the separate global transparency total.' : 'An aggregate-sharing choice can apply to the board if the project later becomes public.'}</p>` : ''}${record.status !== 'verified' ? '<p class="gamify-form-note field full">This receipt will count only after independent verification.</p>' : ''}<p class="gamify-form-note field full">You can withdraw optional public recognition here. Private records and their review history remain available to authorised people. This choice does not publish membership status or claim KYC/ZKP verification.</p>`;
  h.showDialog('Choose public recognition', 'Review the information each choice makes visible before saving.', body, `gamify-${kind}-sharing`, 'Save visibility choices', record.id);
}

export async function handleGamifyClick(action, id, state, h) {
  if (!action.startsWith('gamify-')) return false;
  if (action === 'gamify-method') {
    const method = document.querySelector('.gamify-method');
    if (method) {
      method.open = true;
      method.querySelector('summary')?.focus({ preventScroll: true });
      method.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
    return true;
  }
  if (action === 'gamify-retry' || action === 'gamify-reset') {
    if (action === 'gamify-reset') Object.assign(filters, { period: 'all', groupId: '', projectId: '' });
    if (await loadGamify(h.api)) h.render();
    return true;
  }
  if (action === 'gamify-kind') {
    privateKind = id === 'hours' ? 'hours' : 'money';
    h.render();
    document.querySelector(`[data-action="gamify-kind"][data-id="${privateKind}"]`)?.focus({ preventScroll: true });
    return true;
  }
  if (!state.actor) throw new Error('Sign in before changing contribution records.');
  if (action === 'gamify-money-new') {
    if (!eligibleFinancialProjects(state).length) throw new Error('Join a working group with a project before recording financial support.');
    h.showDialog('Record money received', state.mode === 'demo' ? 'Enter a fictional receipt for this local review. This form does not collect or transfer money.' : 'Record an existing AUD receipt for independent review. This form does not collect payment.', receiptFields(null, state, h), 'gamify-money-new', 'Submit for review');
    return true;
  }
  const [, kind, operation] = action.split('-');
  if (!['money', 'hours'].includes(kind)) return false;
  const record = getReceipt(state, kind, id);
  if (!record) throw new Error('This receipt is no longer available. Refresh the workspace.');
  if (operation === 'sharing') sharingDialog(record, kind, state, h);
  else if (operation === 'review') {
    h.showDialog('Review contribution receipt', 'Verify the evidence independently. Verification can be corrected or revoked with a recorded reason.', `<div class="gamify-sharing-summary field full"><strong>${h.e(record.description)}</strong><span>${kind === 'money' ? money(record.amountCents) : `${hours(record.hours)} C-Hours`} · ${h.dateText(record.date)}</span></div><label class="field full">Review decision<select name="status" data-gamify-review><option value="verified">Verify receipt</option><option value="rejected">Reject receipt</option></select></label>${kind === 'money' ? '<label class="check-field field full"><input type="checkbox" name="settled" required><span>I checked this receipt against the settled payment and its recorded category.</span></label>' : ''}${reasonField(h)}`, `gamify-${kind}-review`, 'Record review', id);
  } else if (operation === 'revoke') {
    h.showDialog('Revoke receipt verification', 'The receipt will stop counting on public boards. Its previous record and this reason remain in the private history.', reasonField(h, 'Why should verification be revoked?'), `gamify-${kind}-revoke`, 'Revoke verification', id);
  } else if (operation === 'refund' && kind === 'money') {
    h.showDialog('Record a completed refund', `Record an actual refund against this receipt. Remaining recognised amount: ${money(net(record))}. This form does not send money.`, `<label class="field full">Refund amount (AUD)<input type="number" name="amount" min="0.01" max="${(net(record) / 100).toFixed(2)}" step="0.01" required></label>${h.field('Private refund reference', 'reference', '', { required: true, full: true, length: 120 })}${reasonField(h, 'Reason for the refund')}`, 'gamify-money-refund', 'Record refund', id);
  } else if (operation === 'correct') {
    const body = kind === 'money' ? receiptFields(record, state, h, { correcting: true }) : `${h.field('Contribution date', 'date', record.date, { type: 'date', required: true, max: h.today() })}<label class="field">Voluntary hours<input type="number" name="hours" min="0.25" max="24" step="any" value="${h.e(record.hours)}" required></label><label class="field full">Contribution description<textarea name="description" maxlength="1000" required>${h.e(record.description)}</textarea></label>${reasonField(h, 'Why does this receipt need correcting?')}`;
    h.showDialog('Correct contribution receipt', 'The corrected receipt returns to pending review and stops counting until independently verified again. Both public-sharing choices are cleared: review the corrected details and choose visibility again. The previous version remains in its history.', body, `gamify-${kind}-correct`, 'Submit correction', id);
  } else return false;
  return true;
}

function cents(value) {
  if (!/^\d{1,8}(?:\.\d{1,2})?$/.test(String(value))) throw new Error('Enter an AUD amount with no more than two decimal places.');
  const [whole, fraction = ''] = String(value).split('.');
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(result) || result < 1 || result > 1000000000) throw new Error('Enter an amount between $0.01 and $10,000,000.');
  return result;
}

export async function handleGamifySubmit(form, state, h) {
  const name = form.dataset.form || '';
  if (!name.startsWith('gamify-')) return false;
  const fields = new FormData(form);
  const [, kind, operation] = name.split('-');
  const contributionId = form.dataset.id;
  const prefix = kind === 'money' ? 'financial' : 'contribution';
  let data;
  if (operation === 'new') data = { projectId: fields.get('projectId'), date: fields.get('date'), amountCents: cents(fields.get('amount')), category: fields.get('category'), reference: fields.get('reference'), description: fields.get('description'), publicConsent: false, namedConsent: false };
  else if (operation === 'sharing') data = { contributionId, publicConsent: fields.has('publicConsent'), namedConsent: fields.has('namedConsent') };
  else if (operation === 'review') data = { contributionId, status: fields.get('status'), reason: fields.get('reason'), ...(kind === 'money' ? { settled: fields.has('settled') } : {}) };
  else if (operation === 'revoke') data = { contributionId, reason: fields.get('reason') };
  else if (operation === 'refund') data = { contributionId, amountCents: cents(fields.get('amount')), reference: fields.get('reference'), reason: fields.get('reason') };
  else if (operation === 'correct') data = { contributionId, date: fields.get('date'), description: fields.get('description'), reason: fields.get('reason'), ...(kind === 'money' ? { projectId: fields.get('projectId'), amountCents: cents(fields.get('amount')), category: fields.get('category'), reference: fields.get('reference') } : { hours: Number(fields.get('hours')) }) };
  else return false;
  await h.command(`${prefix}.${operation === 'new' ? 'log' : operation}`, data);
  h.closeDialog();
  h.notify(operation === 'sharing' ? 'Visibility choices saved. Public recognition has been recalculated.' : operation === 'correct' ? 'Correction submitted for independent review.' : operation === 'new' ? 'Receipt recorded privately and submitted for review.' : 'Receipt updated. Contribution totals have been recalculated.');
  return true;
}

export async function handleGamifyChange(target, api, render) {
  if (target.matches('[data-gamify-named]')) {
    const preview = target.form?.querySelector('[data-gamify-preview]');
    if (preview) preview.hidden = !target.checked;
    return true;
  }
  if (target.matches('[data-gamify-review]')) {
    const settled = target.form?.elements.namedItem('settled');
    if (settled) settled.required = target.value === 'verified';
    return true;
  }
  if (target.id === 'gamify-status') {
    privateStatus = target.value;
    render();
    document.getElementById('gamify-status')?.focus({ preventScroll: true });
    return true;
  }
  const key = target.dataset.gamifyFilter;
  if (!key || !Object.hasOwn(filters, key)) return false;
  filters[key] = target.value;
  if (key === 'groupId') filters.projectId = '';
  const focusId = target.id;
  if (await loadGamify(api)) {
    render();
    document.getElementById(focusId)?.focus({ preventScroll: true });
  }
  return true;
}
