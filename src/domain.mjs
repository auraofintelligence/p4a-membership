import { starterClauses, sourceUrl as constitutionSourceUrl } from './constitution-seed.mjs';
import { AppError } from './errors.mjs';
import { executeGamifyCommand, financialProjection } from './gamify.mjs';
export { AppError } from './errors.mjs';
export { gamifyProjection } from './gamify.mjs';

const THEMES = ['everyday-life', 'missing-middle', 'verse-box', 'civic-evidence', 'local-care'];
const fail = (message, status = 400) => { throw new AppError(message, status); };
const text = (value, name, max = 600, required = false) => {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) fail(`${name} is required and must be no more than ${max} characters.`);
  return value.trim();
};
const bool = (value, name) => { if (typeof value !== 'boolean') fail(`${name} must be a yes or no choice.`); return value; };
const choose = (value, options, name) => options.includes(value) ? value : fail(`Choose a valid ${name}.`);
const find = (items, id, label) => items.find(item => item.id === id) || fail(`${label} was not found.`, 404);
const requireOrganiser = actor => actor.role === 'organiser' || fail('This action needs an organiser.', 403);
const uuid = () => crypto.randomUUID();
const day = value => { const parsed = new Date(value); if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) fail('Choose a valid date.'); return value; };
const safeURL = value => { if (!value) return ''; const result = text(value, 'Evidence link', 1200); let url; try { url = new URL(result); } catch { fail('Use a valid https source link.'); } if (url.protocol !== 'https:') fail('Use a valid https source link.'); return url.href; };
const priority = data => {
  const result = {};
  for (const key of ['urgency', 'importance']) {
    if (!Number.isInteger(data[key]) || data[key] < 1 || data[key] > 5) fail(`${key} must be between 1 and 5.`);
    result[key] = data[key];
  }
  result.reason = text(data.reason, 'Assessment reason', 1800, true);
  result.evidenceUrl = safeURL(data.evidenceUrl);
  result.reviewDate = day(data.reviewDate);
  for (const key of ['joy', 'responsibility', 'abundance', 'uncertainty', 'readiness']) result[key] = text(data[key] ?? '', key, 1200);
  return result;
};
function participation(state, actor, project) {
  if (actor.role === 'organiser') return;
  const group = find(state.groups, project.groupId, 'Group');
  if (!group.memberIds.includes(actor.id) || !project.participantIds.includes(actor.id)) fail('Join this group and project before contributing.', 403);
}
function owns(state, actor, project) {
  if (actor.role === 'organiser') return;
  if (project.ownerId !== actor.id) fail('The project owner or an organiser can change this.', 403);
  const group = find(state.groups, project.groupId, 'Group');
  if (!group.memberIds.includes(actor.id)) fail('You must belong to this working group to manage its project.', 403);
}
export function emptyState() {
  return { revision: 0, people: [], groups: [], projects: [], memberships: [], contributions: [], financialContributions: [], decisions: [], constitutions: [], activity: [], processed: [] };
}
export function normaliseState(state) {
  const next = { ...state, constitutions: state.constitutions === undefined ? [] : state.constitutions, financialContributions: state.financialContributions === undefined ? [] : state.financialContributions };
  if (!Array.isArray(next.constitutions)) fail('The constitution register is invalid.', 503);
  if (!Array.isArray(next.financialContributions)) fail('The financial contribution register is invalid.', 503);
  return next;
}
export function createConstitution({ id = uuid(), title, scope, actorId, at }) {
  return {
    id, title: text(title, 'Draft title', 160, true), scope: choose(scope, ['local-charter', 'movement', 'state', 'federal'], 'draft scope'),
    version: 1, status: 'draft', sourceUrl: constitutionSourceUrl, clauses: starterClauses(), proposals: [], createdBy: actorId, createdAt: at,
  };
}
export function actorFor(state, id) {
  const person = state.people.find(item => item.id === id);
  return person ? { id: person.id, name: person.name, role: person.role === 'organiser' ? 'organiser' : 'member' } : null;
}
export function executeCommand(state, actor, command, now = new Date()) {
  state = normaliseState(state);
  if (!actor || !state.people.some(person => person.id === actor.id)) fail('Sign in before making changes.', 401);
  if (!command || typeof command !== 'object' || Array.isArray(command)) fail('Send a valid command.');
  if (typeof command.id !== 'string' || !/^[a-zA-Z0-9-]{8,80}$/.test(command.id)) fail('A unique command ID is required.');
  const previously = state.processed.find(item => item.id === command.id);
  const fingerprint = JSON.stringify({ type: command.type, data: command.data });
  if (previously) {
    if (previously.actorId !== actor.id || previously.fingerprint !== fingerprint) fail('This command ID was already used for a different request.', 409);
    return { state, result: { ok: true, revision: state.revision, replayed: true } };
  }
  if (command.revision !== state.revision) fail('The workspace changed. Refresh and try again.', 409);
  const next = structuredClone(state), data = command.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail('Command details are required.');
  const at = now.toISOString();
  const profile = find(next.people, actor.id, 'Profile');
  let summary = '';
  switch (command.type) {
    case 'profile.update':
      for (const field of ['name', 'place', 'skills', 'interests']) if (field in data) profile[field] = text(data[field], field, field === 'name' ? 100 : 600, field === 'name');
      for (const field of ['directoryConsent', 'contactConsent']) if (field in data) profile[field] = bool(data[field], field);
      summary = 'Updated own profile and sharing choices.'; break;
    case 'person.create': {
      requireOrganiser(actor);
      const email = text(data.email, 'Email', 254, true).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Enter a valid email address.');
      if (next.people.some(person => person.email.toLowerCase() === email)) fail('This email is already in the CRM.', 409);
      next.people.push({ id: uuid(), name: text(data.name, 'Name', 100, true), email, place: text(data.place ?? '', 'Place'), skills: text(data.skills ?? '', 'Skills'), interests: text(data.interests ?? '', 'Interests'), directoryConsent: false, contactConsent: false, role: 'member' });
      summary = 'Added a contact without marketing consent or membership.'; break;
    }
    case 'group.join': {
      const group = find(next.groups, data.groupId, 'Group');
      if (!group.memberIds.includes(actor.id)) group.memberIds.push(actor.id);
      summary = 'Joined a working group.'; break;
    }
    case 'group.leave': {
      const group = find(next.groups, data.groupId, 'Group');
      group.memberIds = group.memberIds.filter(id => id !== actor.id);
      for (const project of next.projects.filter(item => item.groupId === group.id)) project.participantIds = project.participantIds.filter(id => id !== actor.id);
      summary = 'Left a working group and its project participation.'; break;
    }
    case 'project.create': {
      const group = find(next.groups, data.groupId, 'Group');
      if (!group.memberIds.includes(actor.id) && actor.role !== 'organiser') fail('Join the group before proposing its project.', 403);
      next.projects.push({ id: uuid(), title: text(data.title, 'Project title', 140, true), summary: text(data.summary, 'Project summary', 1800, true), groupId: group.id, theme: choose(data.theme, THEMES, 'theme'), status: 'proposed', ...priority(data), ownerId: actor.id, participantIds: [actor.id], tasks: [], comments: [], assessedBy: actor.id, assessedAt: at, public: false });
      summary = 'Proposed a project and recorded a human priority assessment.'; break;
    }
    case 'project.join': {
      const project = find(next.projects, data.projectId, 'Project');
      const group = find(next.groups, project.groupId, 'Group');
      if (!group.memberIds.includes(actor.id) && actor.role !== 'organiser') fail('Join this working group first.', 403);
      if (!project.participantIds.includes(actor.id)) project.participantIds.push(actor.id);
      summary = 'Joined a project.'; break;
    }
    case 'project.priority': {
      const project = find(next.projects, data.projectId, 'Project'); owns(next, actor, project);
      project.assessmentHistory ??= [];
      project.assessmentHistory.push({ urgency: project.urgency, importance: project.importance, reason: project.reason, evidenceUrl: project.evidenceUrl, reviewDate: project.reviewDate, joy: project.joy, responsibility: project.responsibility, abundance: project.abundance, uncertainty: project.uncertainty, readiness: project.readiness, assessedBy: project.assessedBy, assessedAt: project.assessedAt });
      Object.assign(project, priority(data), { assessedBy: actor.id, assessedAt: at });
      summary = 'Reviewed a project priority; previous assessment retained.'; break;
    }
    case 'project.status': {
      const project = find(next.projects, data.projectId, 'Project'); owns(next, actor, project);
      project.status = choose(data.status, ['proposed', 'active', 'review', 'complete'], 'project status');
      summary = 'Updated a project status.'; break;
    }
    case 'task.add': {
      const project = find(next.projects, data.projectId, 'Project'); participation(next, actor, project);
      project.tasks.push({ id: uuid(), title: text(data.title, 'Task', 240, true), done: false, assigneeId: actor.id });
      summary = 'Added a shared project task.'; break;
    }
    case 'task.toggle': {
      const project = find(next.projects, data.projectId, 'Project'); participation(next, actor, project);
      const task = find(project.tasks, data.taskId, 'Task'); task.done = !task.done;
      summary = 'Updated a shared task.'; break;
    }
    case 'comment.add': {
      const project = find(next.projects, data.projectId, 'Project'); participation(next, actor, project);
      project.comments.push({ id: uuid(), personId: actor.id, text: text(data.text, 'Comment', 2000, true), createdAt: at });
      summary = 'Added a project discussion note.'; break;
    }
    case 'membership.apply':
      if (data.acknowledged !== true) fail('Acknowledge P4A’s current status before applying.');
      if (next.memberships.some(item => item.personId === actor.id && item.status !== 'withdrawn')) fail('You already have an active application or movement membership.', 409);
      next.memberships.push({ id: uuid(), personId: actor.id, organisationId: 'p4a-movement', status: 'pending', kind: 'movement', createdAt: at, acknowledgementVersion: 'movement-in-formation-2026-11-07' });
      summary = 'Applied to join the movement in formation.'; break;
    case 'membership.review': {
      requireOrganiser(actor); const membership = find(next.memberships, data.membershipId, 'Membership');
      if (membership.personId === actor.id) fail('Another organiser must review your own membership.', 403);
      if (membership.status !== 'pending') fail('This application has already been reviewed.', 409);
      membership.status = choose(data.status, ['accepted', 'withdrawn'], 'membership decision');
      membership.reviewedBy = actor.id; membership.reviewedAt = at;
      summary = 'Reviewed a movement application.'; break;
    }
    case 'membership.withdraw': {
      const membership = data.membershipId ? find(next.memberships, data.membershipId, 'Membership') : next.memberships.find(item => item.personId === actor.id && item.status !== 'withdrawn');
      if (!membership) fail('No current membership or application was found.', 404);
      if (membership.personId !== actor.id) fail('You can only withdraw your own membership.', 403);
      membership.status = 'withdrawn'; membership.withdrawnAt = at;
      summary = 'Withdrew own movement membership or application.'; break;
    }
    case 'contribution.log': {
      const project = find(next.projects, data.projectId, 'Project'); participation(next, actor, project);
      if (data.namedConsent === true && project.public !== true) fail('Named recognition requires a public project.');
      const date = day(data.date);
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Brisbane', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
      if (date > today) fail('A contribution must have already happened.');
      if (typeof data.hours !== 'number' || !Number.isFinite(data.hours) || data.hours < 0.25 || data.hours > 24) fail('Record between 0.25 and 24 hours.');
      const description = text(data.description, 'Contribution description', 1000, true);
      if (next.contributions.some(item => item.personId === actor.id && item.projectId === project.id && item.date === date && item.hours === data.hours && item.description === description && item.status !== 'rejected')) fail('This contribution has already been recorded.', 409);
      const dailyHours = next.contributions.filter(item => item.personId === actor.id && item.date === date && !['rejected', 'revoked'].includes(item.status)).reduce((sum, item) => sum + item.hours, 0);
      if (dailyHours + data.hours > 24) fail('Recorded contributions cannot exceed 24 hours in one day.');
      next.contributions.push({ id: uuid(), personId: actor.id, projectId: project.id, date, hours: data.hours, description, status: 'pending', verifierId: null, publicConsent: bool(data.publicConsent ?? false, 'Public totals consent'), namedConsent: bool(data.namedConsent ?? false, 'Named recognition consent'), createdBy: actor.id, createdAt: at, history: [] });
      summary = 'Submitted a voluntary contribution for independent review.'; break;
    }
    case 'contribution.review': {
      requireOrganiser(actor); const contribution = find(next.contributions, data.contributionId, 'Contribution');
      if (contribution.personId === actor.id) fail('Another organiser must verify your own contribution.', 403);
      if (contribution.status !== 'pending') fail('This contribution has already been reviewed.', 409);
      const reviewReason = text(data.reason ?? '', 'Review reason', 1000);
      const { history, ...before } = structuredClone(contribution);
      contribution.history ??= [];
      contribution.history.push({ action: 'review', reason: reviewReason || 'Independent voluntary contribution review.', actorId: actor.id, at, before });
      contribution.status = choose(data.status, ['verified', 'rejected'], 'review outcome'); contribution.verifierId = actor.id; contribution.reviewedAt = at;
      contribution.reviewReason = reviewReason;
      summary = 'Independently reviewed a voluntary contribution.'; break;
    }
    case 'constitution.create': {
      requireOrganiser(actor);
      next.constitutions.push(createConstitution({ title: data.title, scope: data.scope, actorId: actor.id, at }));
      summary = 'Created a constitution working draft; no rules were adopted.'; break;
    }
    case 'constitution.propose': {
      const constitution = find(next.constitutions, data.constitutionId, 'Constitution draft');
      const adding = data.clauseId === null;
      const clause = adding ? { id: uuid(), heading: text(data.heading, 'New clause heading', 160, true), version: 0, body: '' } : find(constitution.clauses, data.clauseId, 'Clause');
      if (!Number.isInteger(data.baseVersion) || data.baseVersion !== clause.version) fail('This clause has changed. Refresh and prepare your proposal against the current draft.', 409);
      const body = text(data.body, 'Proposed wording', 20000, true);
      if (body === clause.body) fail('The proposal needs a change to the current wording.');
      constitution.proposals.push({ id: uuid(), kind: adding ? 'add' : 'replace', ...(adding ? { heading: clause.heading } : {}), clauseId: clause.id, authorId: actor.id, title: text(data.title, 'Proposal title', 160, true), body, reason: text(data.reason, 'Reason for change', 3000, true), evidenceUrl: safeURL(data.evidenceUrl), baseVersion: clause.version, before: clause.body, status: 'open', createdAt: at, comments: [] });
      summary = 'Proposed a change to a constitution working draft.'; break;
    }
    case 'constitution.comment': {
      const constitution = find(next.constitutions, data.constitutionId, 'Constitution draft');
      const proposal = find(constitution.proposals, data.proposalId, 'Amendment proposal');
      proposal.comments.push({ id: uuid(), personId: actor.id, text: text(data.text, 'Discussion comment', 3000, true), createdAt: at });
      summary = 'Added a constitution proposal discussion comment.'; break;
    }
    case 'constitution.review': {
      requireOrganiser(actor);
      const constitution = find(next.constitutions, data.constitutionId, 'Constitution draft');
      const proposal = find(constitution.proposals, data.proposalId, 'Amendment proposal');
      if (proposal.authorId === actor.id) fail('Another organiser must review your own proposal.', 403);
      if (proposal.status !== 'open') fail('This proposal has already been reviewed or withdrawn.', 409);
      const status = choose(data.status, ['accepted', 'declined'], 'draft review outcome');
      const reason = text(data.reason, 'Review reason', 3000, true);
      if (status === 'accepted') {
        if (proposal.kind === 'add') {
          if (constitution.clauses.some(clause => clause.id === proposal.clauseId)) fail('This proposed clause already exists in the draft.', 409);
          constitution.clauses.push({ id: proposal.clauseId, heading: proposal.heading, body: proposal.body, version: 1, history: [], sourceUrl: constitution.sourceUrl });
        } else {
          const clause = find(constitution.clauses, proposal.clauseId, 'Clause');
          if (clause.version !== proposal.baseVersion || clause.body !== proposal.before) fail('The clause changed after this proposal. Prepare a fresh proposal against its current version.', 409);
          clause.history.push({ body: clause.body, version: clause.version, changedBy: actor.id, changedAt: at, proposalId: proposal.id });
          clause.body = proposal.body;
          clause.version += 1;
        }
        constitution.version += 1;
      }
      proposal.status = status; proposal.reviewReason = reason; proposal.reviewedBy = actor.id; proposal.reviewedAt = at;
      summary = status === 'accepted' ? 'Merged a reviewed change into a working draft; no constitution was adopted.' : 'Declined a draft proposal with a recorded reason.'; break;
    }
    case 'constitution.withdraw': {
      const constitution = find(next.constitutions, data.constitutionId, 'Constitution draft');
      const proposal = find(constitution.proposals, data.proposalId, 'Amendment proposal');
      if (proposal.authorId !== actor.id) fail('Only the proposal author may withdraw it.', 403);
      if (proposal.status !== 'open') fail('Only an open proposal can be withdrawn.', 409);
      proposal.status = 'withdrawn'; proposal.withdrawnAt = at;
      summary = 'Withdrew own constitution draft proposal.'; break;
    }
    default:
      summary = executeGamifyCommand(next, actor, command.type, data, now);
      if (!summary) fail('This action is not supported.');
  }
  next.revision += 1;
  next.activity.push({ id: uuid(), type: command.type, actorId: actor.id, at, summary });
  next.processed.push({ id: command.id, actorId: actor.id, fingerprint });
  return { state: next, result: { ok: true, revision: next.revision } };
}

export function publicProjection(state, mode = 'live') {
  const contributions = state.contributions.filter(item => item.status === 'verified' && (item.publicConsent || item.namedConsent));
  return {
    mode, sampleData: mode === 'demo' || mode === 'pilot', status: 'Movement in formation; not a registered political party. No adopted constitution.',
    decisions: state.decisions.filter(item => item.public).map(({ id, title, summary, date, status }) => ({ id, title, summary, date, status })),
    projects: state.projects.filter(item => item.public === true).map(({ id, title, summary, status, theme }) => ({ id, title, summary, status, theme })),
    totals: { verifiedHours: contributions.reduce((sum, item) => sum + item.hours, 0), verifiedContributions: contributions.length },
    money: { enabled: false, status: 'No live collections or financial reporting configured.' },
  };
}
export function projectState(state, actor, mode = 'live', workspace = false) {
  state = normaliseState(state);
  const base = { mode, actor, revision: state.revision, people: [], groups: [], projects: [], memberships: [], contributions: [], financialContributions: [], decisions: [], constitutions: [], activity: [], billing: { enabled: false }, integrations: { workspace }, public: publicProjection(state, mode) };
  base.decisions = base.public.decisions;
  if (!actor) { base.projects = base.public.projects; return base; }
  const organiser = actor.role === 'organiser';
  base.constitutions = structuredClone(state.constitutions);
  base.people = state.people.filter(person => organiser || person.id === actor.id || person.directoryConsent === true).map(person => {
    if (organiser || person.id === actor.id) {
      const { authSubject, role, ...profile } = person;
      return profile;
    }
    const { id, name, place, skills, interests } = person;
    return { id, name, place, skills, interests, directoryConsent: true };
  });
  base.groups = state.groups.map(group => ({ ...group, memberIds: organiser ? [...group.memberIds] : group.memberIds.filter(id => id === actor.id), memberCount: group.memberIds.length }));
  base.projects = state.projects.filter(project => organiser || state.groups.find(group => group.id === project.groupId)?.memberIds.includes(actor.id)).map(project => structuredClone(project));
  base.memberships = state.memberships.filter(item => organiser || item.personId === actor.id).map(item => structuredClone(item));
  base.contributions = state.contributions.filter(item => organiser || item.personId === actor.id).map(item => structuredClone(item));
  base.financialContributions = state.financialContributions.filter(item => organiser || item.personId === actor.id).map(financialProjection);
  base.activity = state.activity.filter(item => organiser || item.actorId === actor.id).slice(-100).reverse().map(item => ({ ...item }));
  return base;
}
