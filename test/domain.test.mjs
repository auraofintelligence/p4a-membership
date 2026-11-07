import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { createDemoState } from '../src/seed.mjs';
import { actorFor, executeCommand, projectState, publicProjection, emptyState } from '../src/domain.mjs';
import { api } from '../src/http.mjs';
import worker from '../src/worker.mjs';
globalThis.crypto ??= webcrypto;
const when = new Date('2026-11-07T10:00:00.000Z');
const command = (state, type, data, id = crypto.randomUUID()) => ({ id, revision: state.revision, type, data });
const apply = (state, actorId, type, data) => executeCommand(state, actorFor(state, actorId), command(state, type, data), when).state;
const samplePriority = { urgency: 5, importance: 4, reason: 'A documented decision window needs a community response.', evidenceUrl: 'https://example.test/source', reviewDate: '2026-11-20', joy: 'More time for people.', responsibility: 'People control their own information.', abundance: 'Shared research becomes available.', uncertainty: 'Host not yet agreed.', readiness: 'Discovery' };

test('anonymous projection never exposes profiles, memberships, private comments or contribution descriptions', () => {
  const state = createDemoState();
  state.decisions.push({ id: 'secret', title: 'Private deliberation', public: false });
  const projection = projectState(state, null, 'demo');
  assert.equal(projection.people.length, 0);
  assert.equal(projection.memberships.length, 0);
  assert.equal(projection.contributions.length, 0);
  assert.equal(projection.activity.length, 0);
  const serialized = JSON.stringify(projection);
  for (const sensitive of ['alex@example.invalid', 'person-1', 'task-1', 'comment-1', 'Private deliberation']) assert.equal(serialized.includes(sensitive), false, sensitive);
  assert.equal(projection.public.sampleData, true);
});

test('member sees own CRM record, opted-in directory profiles and joined-group projects; auth subjects are never exported', () => {
  const state = createDemoState(); state.people[0].authSubject = 'private-subject';
  state.projects.push({ ...state.projects[0], id: 'private-project', groupId: 'group-2' });
  const member = projectState(state, actorFor(state, 'person-1'));
  assert.deepEqual(member.people.map(person => person.id), ['person-1', 'person-2']);
  assert.equal(member.memberships.length, 0);
  assert.equal(member.projects.some(project => project.id === 'private-project'), false);
  assert.equal(member.groups[0].memberCount, 2);
  assert.deepEqual(member.groups[0].memberIds, ['person-1']);
  const organiser = projectState(state, actorFor(state, 'person-2'));
  assert.equal(organiser.people.length, 3);
  assert.equal(JSON.stringify(organiser).includes('private-subject'), false);
});

test('directory consent reveals only chosen profile fields to members and withdrawal removes them', () => {
  let state = createDemoState();
  state.people[1].authSubject = 'private-organiser-subject';
  state.people[1].contactConsent = true;
  state.people[1].privateNote = 'Not a directory field';
  state.memberships.push({ id: 'private-membership', personId: 'person-2', status: 'accepted' });
  let memberView = projectState(state, actorFor(state, 'person-1'));
  const directory = memberView.people.find(person => person.id === 'person-2');
  assert.deepEqual(Object.keys(directory).sort(), ['id', 'name', 'place', 'skills', 'interests', 'directoryConsent'].sort());
  assert.equal(directory.name, 'Sam Taylor');
  assert.equal(directory.directoryConsent, true);
  for (const field of ['email', 'contactConsent', 'authSubject', 'role', 'privateNote']) assert.equal(field in directory, false);
  assert.equal(memberView.memberships.some(item => item.id === 'private-membership'), false);
  assert.equal(projectState(state, null).people.length, 0, 'directory consent does not allow anonymous publication');
  state = apply(state, 'person-2', 'profile.update', { directoryConsent: false });
  memberView = projectState(state, actorFor(state, 'person-1'));
  assert.equal(memberView.people.some(person => person.id === 'person-2'), false);
  const own = memberView.people.find(person => person.id === 'person-1');
  assert.equal(own.email, 'alex@example.invalid');
  assert.equal(projectState(state, actorFor(state, 'person-2')).people.length, 3, 'organiser CRM remains separate from member directory');
});

test('profile edits are self-only and cannot grant roles or replace an email', () => {
  const state = apply(createDemoState(), 'person-1', 'profile.update', { name: 'Example Name', role: 'organiser', email: 'changed@example.invalid', id: 'person-2', directoryConsent: true });
  assert.equal(state.people[0].name, 'Example Name');
  assert.equal(state.people[0].role, 'member');
  assert.equal(state.people[0].email, 'alex@example.invalid');
  assert.equal(state.people[1].name, 'Sam Taylor');
  assert.equal(state.people[0].directoryConsent, true);
});

test('new contacts require organiser access and start without consent or membership', () => {
  const state = createDemoState(), data = { name: 'New Example', email: 'new@example.invalid' };
  assert.throws(() => apply(state, 'person-1', 'person.create', data), /organiser/);
  const result = apply(state, 'person-2', 'person.create', data);
  assert.equal(result.people.at(-1).directoryConsent, false);
  assert.equal(result.people.at(-1).contactConsent, false);
  assert.equal(result.memberships.length, state.memberships.length);
  assert.throws(() => apply(result, 'person-2', 'person.create', data), /already/);
});

test('idempotency returns a successful replay without double mutation; reusing IDs is rejected', () => {
  const state = createDemoState(), actor = actorFor(state, 'person-1');
  const request = command(state, 'group.join', { groupId: 'group-2' });
  const outcome = executeCommand(state, actor, request, when);
  const repeated = executeCommand(outcome.state, actor, request, when);
  assert.equal(repeated.result.replayed, true);
  assert.equal(repeated.state.revision, 1);
  assert.equal(repeated.state.activity.length, 1);
  assert.throws(() => executeCommand(outcome.state, actor, { ...request, data: { groupId: 'group-1' } }, when), /different request/);
  assert.throws(() => executeCommand(outcome.state, actorFor(state, 'person-2'), request, when), /different request/);
});

test('stale revision and anonymous commands cannot mutate state', () => {
  const state = createDemoState(), request = command(state, 'group.join', { groupId: 'group-2' });
  assert.throws(() => executeCommand(state, null, request, when), /Sign in/);
  assert.throws(() => executeCommand(state, actorFor(state, 'person-1'), { ...request, revision: -1 }, when), /workspace changed/);
  assert.equal(state.revision, 0);
});

test('joining and leaving a working group never creates party membership and leaving removes participation', () => {
  let state = createDemoState();
  state = apply(state, 'person-1', 'group.join', { groupId: 'group-2' });
  assert.equal(state.memberships.length, 1);
  state = apply(state, 'person-1', 'project.join', { projectId: 'project-2' });
  assert.equal(state.projects[1].participantIds.includes('person-1'), true);
  state = apply(state, 'person-1', 'group.leave', { groupId: 'group-1' });
  assert.equal(state.projects.some(project => project.participantIds.includes('person-1')), false);
  assert.throws(() => apply(state, 'person-1', 'comment.add', { projectId: 'project-1', text: 'No access' }), /Join/);
});

test('a project owner loses management access on leaving its group while organiser authority remains explicit', () => {
  let state = apply(createDemoState(), 'person-1', 'group.leave', { groupId: 'group-1' });
  assert.equal(projectState(state, actorFor(state, 'person-1')).projects.some(project => project.id === 'project-1'), false);
  assert.throws(() => apply(state, 'person-1', 'project.status', { projectId: 'project-1', status: 'complete' }), error => error.status === 403);
  assert.throws(() => apply(state, 'person-1', 'project.priority', { projectId: 'project-1', ...samplePriority }), error => error.status === 403);
  assert.equal(state.projects[0].status, 'active');
  assert.equal(state.projects[0].urgency, 4);
  state = apply(state, 'person-2', 'group.leave', { groupId: 'group-1' });
  state = apply(state, 'person-2', 'project.status', { projectId: 'project-1', status: 'review' });
  assert.equal(state.projects[0].status, 'review');
});

test('project creation preserves explicit JRA reasoning and defaults to private proposal', () => {
  let state = createDemoState();
  assert.throws(() => apply(state, 'person-1', 'project.create', { title: 'Example', summary: 'Example project', groupId: 'group-2', theme: 'verse-box', ...samplePriority }), /Join/);
  state = apply(state, 'person-1', 'project.create', { title: 'Example', summary: 'Example project', groupId: 'group-1', theme: 'verse-box', ...samplePriority });
  const project = state.projects.at(-1);
  assert.equal(project.status, 'proposed'); assert.equal(project.public, false);
  assert.equal(project.responsibility, samplePriority.responsibility);
  assert.equal(project.assessedBy, 'person-1');
});

test('priority review preserves previous assessment and is restricted to owner or organiser', () => {
  let state = createDemoState();
  assert.throws(() => apply(state, 'person-1', 'project.priority', { projectId: 'project-2', ...samplePriority }), /owner/);
  state = apply(state, 'person-1', 'project.priority', { projectId: 'project-1', ...samplePriority });
  assert.equal(state.projects[0].assessmentHistory.length, 1);
  assert.equal(state.projects[0].assessmentHistory[0].urgency, 4);
  assert.equal(state.projects[0].urgency, 5);
  for (const data of [{ urgency: 6 }, { importance: '3' }, { evidenceUrl: 'javascript:alert(1)' }, { reviewDate: '2026-99-99' }]) {
    assert.throws(() => apply(state, 'person-1', 'project.priority', { projectId: 'project-1', ...samplePriority, ...data }));
  }
});

test('shared tasks and comments require project participation; command input stays literal', () => {
  let state = createDemoState();
  assert.throws(() => apply(state, 'person-1', 'task.add', { projectId: 'project-2', title: 'Test' }), /Join/);
  state = apply(state, 'person-1', 'task.add', { projectId: 'project-1', title: 'Review the exact source' });
  const taskId = state.projects[0].tasks.at(-1).id;
  state = apply(state, 'person-1', 'task.toggle', { projectId: 'project-1', taskId });
  assert.equal(state.projects[0].tasks.at(-1).done, true);
  state = apply(state, 'person-1', 'comment.add', { projectId: 'project-1', text: '<img src=x onerror=alert(1)>' });
  assert.equal(state.projects[0].comments.at(-1).text, '<img src=x onerror=alert(1)>');
  assert.throws(() => apply(state, 'person-1', 'comment.add', { projectId: 'project-1', text: 'x'.repeat(2001) }), /2000/);
});

test('movement joining requires acknowledgement, avoids duplicates, supports independent review and departure', () => {
  let state = createDemoState();
  assert.throws(() => apply(state, 'person-1', 'membership.apply', {}), /Acknowledge/);
  state = apply(state, 'person-1', 'membership.apply', { acknowledged: true });
  const id = state.memberships.at(-1).id;
  assert.throws(() => apply(state, 'person-1', 'membership.apply', { acknowledged: true }), /already/);
  assert.throws(() => apply(state, 'person-1', 'membership.review', { membershipId: id, status: 'accepted' }), /organiser/);
  state = apply(state, 'person-2', 'membership.review', { membershipId: id, status: 'accepted' });
  assert.equal(state.memberships.at(-1).status, 'accepted');
  assert.throws(() => apply(state, 'person-2', 'membership.withdraw', { membershipId: id }), /own/);
  state = apply(state, 'person-1', 'membership.withdraw', { membershipId: id });
  assert.equal(state.memberships.at(-1).status, 'withdrawn');
});

test('organiser cannot approve own membership or verify own voluntary time', () => {
  let state = apply(createDemoState(), 'person-2', 'membership.apply', { acknowledged: true });
  assert.throws(() => apply(state, 'person-2', 'membership.review', { membershipId: state.memberships.at(-1).id, status: 'accepted' }), /Another organiser/);
  state = apply(state, 'person-2', 'contribution.log', { projectId: 'project-1', date: '2026-11-07', hours: 1, description: 'Example preparation' });
  assert.throws(() => apply(state, 'person-2', 'contribution.review', { contributionId: state.contributions.at(-1).id, status: 'verified' }), /Another organiser/);
});

test('contribution receipts reject duplicates, future dates, impossible durations, and count only consented verified time', () => {
  let state = createDemoState();
  const receipt = { projectId: 'project-1', date: '2026-11-07', hours: 1.25, description: 'Reviewed a sample question', publicConsent: true };
  for (const wrong of [{ hours: -1 }, { hours: 25 }, { hours: Infinity }, { date: '2026-11-08' }, { date: '2026-02-30' }]) assert.throws(() => apply(state, 'person-1', 'contribution.log', { ...receipt, ...wrong }));
  state = apply(state, 'person-1', 'contribution.log', receipt);
  assert.throws(() => apply(state, 'person-1', 'contribution.log', receipt), /already/);
  assert.equal(publicProjection(state).totals.verifiedHours, 0);
  const id = state.contributions.at(-1).id;
  state = apply(state, 'person-2', 'contribution.review', { contributionId: id, status: 'verified' });
  assert.equal(publicProjection(state).totals.verifiedHours, 1.25);
  assert.throws(() => apply(state, 'person-2', 'contribution.review', { contributionId: id, status: 'verified' }), /already/);
  state = apply(state, 'person-2', 'contribution.review', { contributionId: 'contribution-1', status: 'verified' });
  assert.equal(publicProjection(state).totals.verifiedHours, 1.25, 'unconsented hours stay out of public totals');
  assert.equal(JSON.stringify(publicProjection(state)).includes('Reviewed a sample question'), false);
});

function context(state = createDemoState(), actorId = 'person-1') {
  return { store: { read: async () => state, compareAndSwap: async () => true }, getActor: async () => actorFor(state, actorId), mode: 'demo', workspace: false };
}
const post = (body, headers = {}) => new Request('http://127.0.0.1:8791/api/commands', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://127.0.0.1:8791', ...headers }, body: JSON.stringify(body) });

test('HTTP layer rejects cross-origin changes, non-JSON bodies and oversized requests', async () => {
  const state = createDemoState(), request = command(state, 'group.join', { groupId: 'group-2' });
  assert.equal((await api(post(request, { Origin: 'https://evil.test' }), context(state))).status, 403);
  assert.equal((await api(post(request, { 'Content-Type': 'text/plain' }), context(state))).status, 415);
  assert.equal((await api(post({ ...request, unused: 'x'.repeat(40000) }), context(state))).status, 413);
  const valid = await api(post(request), context(state));
  assert.equal(valid.status, 200); assert.equal(valid.headers.get('Cache-Control'), 'no-store');
});

test('HTTP API denies anonymous exports and handles revision races without claiming success', async () => {
  const state = createDemoState(), ctx = context(state);
  ctx.store.compareAndSwap = async () => false;
  assert.equal((await api(post(command(state, 'group.join', { groupId: 'group-2' })), ctx)).status, 409);
  assert.equal((await api(new Request('http://127.0.0.1:8791/api/export'), context(state, null))).status, 401);
  const exportResponse = await api(new Request('http://127.0.0.1:8791/api/export'), context(state));
  const result = await exportResponse.json();
  assert.equal(result.people.length, 2);
  assert.equal(result.people.find(person => person.id === 'person-2').email, undefined);
  assert.match(exportResponse.headers.get('Content-Disposition'), /attachment/);
});

test('production Worker never enables demo impersonation and unconfigured private access fails closed', async () => {
  const env = {};
  assert.equal((await worker.fetch(new Request('https://membership.example.test/api/demo/session', { method: 'POST' }), env)).status, 404);
  const result = await (await worker.fetch(new Request('https://membership.example.test/api/bootstrap', { headers: { Cookie: 'p4a_demo=person-2' } }), env)).json();
  assert.equal(result.mode, 'live'); assert.equal(result.actor, null); assert.equal(result.people.length, 0); assert.equal(result.billing.enabled, false);
  assert.equal((await worker.fetch(new Request('https://membership.example.test/api/export'), env)).status, 401);
  assert.equal(emptyState().people.length, 0);
});
