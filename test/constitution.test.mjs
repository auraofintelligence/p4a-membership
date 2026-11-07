import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { actorFor, emptyState, executeCommand, normaliseState, projectState, publicProjection } from '../src/domain.mjs';
import { createDemoState, migrateDemoState } from '../src/seed.mjs';
globalThis.crypto ??= webcrypto;
const now = new Date('2026-11-07T10:00:00.000Z');
const run = (state, actorId, type, data) => executeCommand(state, actorFor(state, actorId), { id: crypto.randomUUID(), revision: state.revision, type, data }, now).state;
const propose = (state, actorId = 'person-1', extra = {}) => {
  const draft = state.constitutions[0], clause = draft.clauses[0];
  return run(state, actorId, 'constitution.propose', { constitutionId: draft.id, clauseId: clause.id, title: 'Clarify shared responsibility', body: `${clause.body}\n\nA proposed clarification for review.`, reason: 'Make the working wording clearer for participants.', evidenceUrl: 'https://p4a.xyz/pages/constitution.html', baseVersion: clause.version, ...extra });
};
const review = (state, proposalId, status = 'accepted', actorId = 'person-2') => run(state, actorId, 'constitution.review', { constitutionId: state.constitutions[0].id, proposalId, status, reason: 'Independent drafting review, not constitutional adoption.' });

test('constitution creation needs organiser authority, keeps separate scopes, and always creates a draft', () => {
  const initial = createDemoState();
  assert.throws(() => run(initial, 'person-1', 'constitution.create', { title: 'Example', scope: 'state' }), error => error.status === 403);
  for (const scope of ['movement', 'local-charter', 'state', 'federal']) {
    const state = run(initial, 'person-2', 'constitution.create', { title: `Example ${scope}`, scope, status: 'adopted' });
    const draft = state.constitutions.at(-1);
    assert.equal(draft.scope, scope); assert.equal(draft.status, 'draft'); assert.equal(draft.version, 1);
    assert.equal(draft.clauses.length, 10);
    assert.ok(draft.clauses.every(clause => clause.version === 1 && clause.history.length === 0 && clause.body.startsWith('Proposed for discussion:')));
    assert.equal(draft.sourceUrl, 'https://p4a.xyz/pages/constitution.html');
  }
  assert.throws(() => run(initial, 'person-2', 'constitution.create', { title: 'Example', scope: 'registered-party' }));
});

test('proposals capture exact before wording and version; comments preserve author and time', () => {
  const initial = createDemoState();
  let state = propose(initial);
  const draft = state.constitutions[0], proposal = draft.proposals[0];
  assert.equal(proposal.before, initial.constitutions[0].clauses[0].body);
  assert.equal(proposal.baseVersion, 1); assert.equal(proposal.authorId, 'person-1'); assert.equal(proposal.status, 'open');
  assert.equal(draft.clauses[0].body, proposal.before, 'proposing does not change a clause');
  state = run(state, 'person-3', 'constitution.comment', { constitutionId: draft.id, proposalId: proposal.id, text: 'Please clarify the consequence of this change.' });
  assert.equal(state.constitutions[0].proposals[0].comments[0].personId, 'person-3');
  assert.equal(state.constitutions[0].proposals[0].comments[0].createdAt, now.toISOString());
  assert.throws(() => propose(state, 'person-1', { baseVersion: 0 }), error => error.status === 409);
});

test('only an independent organiser can merge a proposal; merge preserves version history without adopting rules', () => {
  let state = propose(createDemoState());
  delete state.constitutions[0].proposals[0].kind; // Older replacement proposals remain reviewable.
  const proposal = state.constitutions[0].proposals[0], original = state.constitutions[0].clauses[0].body;
  assert.throws(() => review(state, proposal.id, 'accepted', 'person-3'), error => error.status === 403);
  state = review(state, proposal.id);
  const draft = state.constitutions[0], clause = draft.clauses[0];
  assert.equal(draft.status, 'draft'); assert.equal(draft.version, 2); assert.equal(clause.version, 2);
  assert.equal(clause.body, proposal.body);
  assert.deepEqual(clause.history[0], { body: original, version: 1, changedBy: 'person-2', changedAt: now.toISOString(), proposalId: proposal.id });
  assert.equal(draft.proposals[0].reviewedBy, 'person-2');
  assert.equal(draft.proposals[0].reviewReason, 'Independent drafting review, not constitutional adoption.');
  assert.throws(() => review(state, proposal.id), error => error.status === 409);
  const own = propose(createDemoState(), 'person-2');
  assert.throws(() => review(own, own.constitutions[0].proposals[0].id), error => error.status === 403);
});

test('new clauses use independent review without changing existing clauses or losing proposal discussion', () => {
  const initial = createDemoState(), originalClauses = structuredClone(initial.constitutions[0].clauses);
  const data = { constitutionId: 'constitution-1', clauseId: null, heading: 'Reviewing local knowledge', baseVersion: 0, title: 'Add a local knowledge clause', body: 'Proposed for discussion: communities should review how local knowledge is represented.', reason: 'Add a subject the current draft has not yet addressed.', evidenceUrl: 'https://p4a.xyz/pages/constitution.html' };
  let state = run(initial, 'person-1', 'constitution.propose', data);
  const proposal = state.constitutions[0].proposals[0];
  assert.equal(proposal.kind, 'add'); assert.equal(proposal.before, ''); assert.equal(proposal.baseVersion, 0);
  assert.equal(proposal.heading, data.heading);
  assert.deepEqual(state.constitutions[0].clauses, originalClauses, 'proposal does not insert a clause before review');
  state = run(state, 'person-3', 'constitution.comment', { constitutionId: 'constitution-1', proposalId: proposal.id, text: 'Please keep local review and permission explicit.' });
  state = review(state, proposal.id);
  const draft = state.constitutions[0], added = draft.clauses.at(-1);
  assert.deepEqual(draft.clauses.slice(0, -1), originalClauses);
  assert.deepEqual(added, { id: proposal.clauseId, heading: data.heading, body: data.body, version: 1, history: [], sourceUrl: draft.sourceUrl });
  assert.equal(draft.version, 2); assert.equal(draft.status, 'draft');
  assert.equal(draft.proposals[0].comments[0].text, 'Please keep local review and permission explicit.');
  assert.equal(draft.proposals[0].reviewedBy, 'person-2');
  assert.throws(() => review(state, proposal.id), error => error.status === 409);
  assert.equal(state.constitutions[0].clauses.length, 11);
  const own = run(initial, 'person-2', 'constitution.propose', data);
  assert.throws(() => review(own, own.constitutions[0].proposals[0].id), error => error.status === 403);
  assert.throws(() => run(initial, 'person-1', 'constitution.propose', { ...data, heading: 'x'.repeat(161) }));
  assert.throws(() => run(initial, 'person-1', 'constitution.propose', { ...data, baseVersion: 1 }), error => error.status === 409);
});

test('new-clause reviews are scoped to their document and cannot reuse an existing clause ID', () => {
  let state = run(createDemoState(), 'person-2', 'constitution.create', { title: 'Separate local charter', scope: 'local-charter' });
  const data = { constitutionId: 'constitution-1', clauseId: null, heading: 'Proposed new clause', baseVersion: 0, title: 'Add a clause', body: 'Proposed for discussion.', reason: 'Test a separately reviewable addition.' };
  state = run(state, 'person-1', 'constitution.propose', data);
  const proposal = state.constitutions[0].proposals[0];
  assert.throws(() => run(state, 'person-2', 'constitution.review', { constitutionId: state.constitutions[1].id, proposalId: proposal.id, status: 'accepted', reason: 'Wrong document' }), error => error.status === 404);
  state.constitutions[0].clauses.push({ id: proposal.clauseId, heading: 'An existing clause', body: 'Do not overwrite', version: 1, history: [] });
  assert.throws(() => review(state, proposal.id), error => error.status === 409);
  assert.equal(state.constitutions[0].clauses.at(-1).body, 'Do not overwrite');
  state = review(state, proposal.id, 'declined');
  assert.equal(state.constitutions[0].proposals[0].status, 'declined');
  assert.equal(state.constitutions[0].version, 1);
});

test('stale parallel amendments cannot overwrite newer wording and may be independently declined', () => {
  let state = propose(createDemoState());
  state = propose(state, 'person-3', { title: 'Alternative wording', body: 'An alternative proposed clause, not adopted.' });
  const [first, second] = state.constitutions[0].proposals;
  state = review(state, first.id);
  assert.throws(() => review(state, second.id), error => error.status === 409);
  assert.equal(state.constitutions[0].clauses[0].body, first.body);
  state = review(state, second.id, 'declined');
  assert.equal(state.constitutions[0].proposals[1].status, 'declined');
  assert.equal(state.constitutions[0].clauses[0].body, first.body);
  assert.equal(state.constitutions[0].clauses[0].history.length, 1);
});

test('authors may withdraw only their own open amendments and reviews need a reason', () => {
  let state = propose(createDemoState());
  const id = state.constitutions[0].proposals[0].id;
  const data = { constitutionId: 'constitution-1', proposalId: id };
  assert.throws(() => run(state, 'person-2', 'constitution.withdraw', data), error => error.status === 403);
  assert.throws(() => run(state, 'person-2', 'constitution.review', { ...data, status: 'declined', reason: '' }));
  state = run(state, 'person-1', 'constitution.withdraw', data);
  assert.equal(state.constitutions[0].proposals[0].status, 'withdrawn');
  assert.throws(() => review(state, id), error => error.status === 409);
  assert.throws(() => run(state, 'person-1', 'constitution.withdraw', data), error => error.status === 409);
});

test('constitution drafts and discussions are available only in authenticated workspace projections', () => {
  const state = propose(createDemoState());
  const publicState = projectState(state, null, 'demo');
  assert.deepEqual(publicState.constitutions, []);
  assert.equal(JSON.stringify(publicState).includes('Clarify shared responsibility'), false);
  assert.equal(JSON.stringify(publicProjection(state)).includes('constitution-1'), false);
  const memberState = projectState(state, actorFor(state, 'person-3'));
  assert.equal(memberState.constitutions[0].proposals[0].title, 'Clarify shared responsibility');
  memberState.constitutions[0].clauses[0].body = 'Changed export object';
  assert.notEqual(state.constitutions[0].clauses[0].body, 'Changed export object');
  assert.throws(() => run(state, null, 'constitution.propose', {}), error => error.status === 401);
});

test('legacy state migration preserves existing demo work and never seeds live Workspace records', () => {
  const legacy = createDemoState();
  delete legacy.constitutions;
  legacy.revision = 42;
  legacy.people[0].name = 'Edited local example';
  legacy.projects[0].comments.push({ id: 'existing-work', text: 'Preserve this review work' });
  const before = structuredClone(legacy);
  const migrated = migrateDemoState(legacy);
  assert.equal(migrated.revision, 43);
  assert.equal(migrated.constitutions.length, 1);
  assert.deepEqual({ ...migrated, revision: 42, constitutions: undefined }, { ...before, constitutions: undefined });
  assert.deepEqual(legacy, before, 'migration does not mutate the caller');
  assert.equal(migrateDemoState(migrated), migrated, 'restart does not duplicate the draft or advance revisions');
  const liveLegacy = emptyState(); delete liveLegacy.constitutions;
  const live = normaliseState(liveLegacy);
  assert.deepEqual(live.constitutions, []); assert.equal(live.revision, 0);
  assert.equal(liveLegacy.constitutions, undefined, 'reading live state does not write its document');
  assert.throws(() => normaliseState({ ...emptyState(), constitutions: {} }), error => error.status === 503);
});
