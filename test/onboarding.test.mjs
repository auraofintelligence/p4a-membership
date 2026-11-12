import test from 'node:test';
import assert from 'node:assert/strict';
import { actorFor, emptyState, executeCommand, normaliseState, projectState, publicProjection } from '../src/domain.mjs';
import { onboardingPolicyVersion, onboardingQuestions } from '../src/onboarding.mjs';
import { api } from '../src/http.mjs';
import { createDemoState } from '../src/seed.mjs';
import { createPreviewApi } from '../preview/demo-api.mjs';

const when = new Date('2026-11-12T02:00:00Z');
const policy = { policyVersion: onboardingPolicyVersion };
const answers = Object.fromEntries(onboardingQuestions.map(question => [question.id, question.options[0].id]));
const makeCommand = (state, type, data) => ({ id: crypto.randomUUID(), revision: state.revision, type, data });
const run = (state, personId, type, data, context = { mode: 'demo' }) => executeCommand(state, actorFor(state, personId), makeCommand(state, type, data), when, context).state;
const start = (state = createDemoState(), personId = 'person-1') => run(state, personId, 'onboarding.start', { ...policy, acknowledged: true });
const submit = (state, personId = 'person-1') => run(state, personId, 'onboarding.submit', { ...policy, caseId: state.onboardingCases.find(record => record.personId === personId && record.status !== 'withdrawn').id, answers });
const review = (state, outcome, reason = 'Fictional independent review.') => run(state, 'person-2', 'onboarding.review', { caseId: state.onboardingCases[0].id, outcome, reason });

test('older state gains an empty rehearsal register without changing existing data', () => {
  const state = createDemoState();
  delete state.onboardingCases;
  const before = structuredClone(state);
  const normalised = normaliseState(state);
  assert.deepEqual(normalised.onboardingCases, []);
  assert.deepEqual(state, before);
  assert.equal(normalised.revision, before.revision);
  assert.equal(normalised.people, state.people);
  assert.deepEqual(emptyState().onboardingCases, []);
  assert.throws(() => normaliseState({ ...state, onboardingCases: null }), { status: 503 });
  assert.throws(() => normaliseState({ ...state, onboardingCases: {} }), { status: 503 });
});

test('only a trusted demo mode can create, change or replay rehearsal commands', () => {
  const state = createDemoState();
  const actor = actorFor(state, 'person-1');
  const command = { ...makeCommand(state, 'onboarding.start', { ...policy, acknowledged: true, mode: 'demo' }), mode: 'demo' };
  assert.throws(() => executeCommand(state, actor, command, when), { status: 403 });
  for (const mode of ['pilot', 'live', 'preview', undefined]) {
    assert.throws(() => executeCommand(state, actor, command, when, { mode }), { status: 403 });
  }
  assert.throws(() => executeCommand(state, null, command, when, { mode: 'demo' }), { status: 401 });
  const first = executeCommand(state, actor, command, when, { mode: 'demo' });
  const replay = executeCommand(first.state, actor, command, when, { mode: 'demo' });
  assert.equal(replay.result.replayed, true);
  assert.equal(replay.state.onboardingCases.length, 1);
  assert.equal(replay.state.revision, first.state.revision);
  assert.equal(replay.state.activity.length, first.state.activity.length);
  assert.throws(() => executeCommand(first.state, actor, command, when, { mode: 'live' }), { status: 403 });
  assert.throws(() => executeCommand(first.state, actor, { ...command, data: { ...command.data, acknowledged: false } }, when, { mode: 'demo' }), { status: 409 });
  assert.throws(() => executeCommand(first.state, actorFor(state, 'person-2'), command, when, { mode: 'demo' }), { status: 409 });
});

test('starting requires the current acknowledgement and creates only one active case for the actor', () => {
  const original = createDemoState();
  assert.throws(() => run(original, 'person-1', 'onboarding.start', { ...policy, acknowledged: false }), { status: 400 });
  assert.throws(() => run(original, 'person-1', 'onboarding.start', { policyVersion: 'old', acknowledged: true }), { status: 409 });
  const state = run(original, 'person-1', 'onboarding.start', { ...policy, acknowledged: true, personId: 'person-2', status: 'accepted', role: 'organiser' });
  assert.equal(state.onboardingCases[0].personId, 'person-1');
  assert.equal(state.onboardingCases[0].status, 'draft');
  assert.equal(state.onboardingCases[0].createdAt, when.toISOString());
  assert.deepEqual(state.people, original.people);
  assert.deepEqual(state.memberships, original.memberships);
  assert.throws(() => start(state), { status: 409 });
});

test('submission requires own editable case, current policy and exactly one known answer per question', () => {
  const state = start();
  const caseId = state.onboardingCases[0].id;
  const data = { ...policy, caseId, answers };
  assert.throws(() => run(state, 'person-2', 'onboarding.submit', data), { status: 403 });
  assert.throws(() => run(state, 'person-3', 'onboarding.submit', data), { status: 403 });
  assert.throws(() => run(state, 'person-1', 'onboarding.submit', { ...data, caseId: 'missing' }), { status: 404 });
  assert.throws(() => run(state, 'person-1', 'onboarding.submit', { ...data, policyVersion: 'old' }), { status: 409 });
  for (const invalid of [null, [], {}, { ...answers, unexpected: 'value' }, { ...answers, evidence: 'invented' }, { ...answers, privacy: false }, { ...answers, disagreement: ['explain-concerns'] }, { privacy: answers.privacy, disagreement: answers.disagreement }]) {
    assert.throws(() => run(state, 'person-1', 'onboarding.submit', { ...data, answers: invalid }), { status: 400 });
  }
  assert.equal(state.onboardingCases[0].status, 'draft', 'failed submission does not mutate its input state');
  const submitted = submit(state);
  assert.equal(submitted.onboardingCases[0].status, 'submitted');
  assert.deepEqual(submitted.onboardingCases[0].answers, answers);
  assert.equal(submitted.onboardingCases[0].submittedAt, when.toISOString());
  assert.throws(() => submit(submitted), { status: 409 });
  const stale = makeCommand(state, 'onboarding.submit', data);
  assert.throws(() => executeCommand(submitted, actorFor(state, 'person-1'), stale, when, { mode: 'demo' }), { status: 409 });
});

test('independent review retains review history, supports revisions and never grants membership or verification', () => {
  const initial = createDemoState();
  const draft = start(initial);
  assert.throws(() => review(draft, 'ready-for-checks'), { status: 409 });
  let state = submit(draft);
  const data = { caseId: state.onboardingCases[0].id, outcome: 'ready-for-checks', reason: 'Review.' };
  assert.throws(() => run(state, 'person-1', 'onboarding.review', data), { status: 403 });
  assert.throws(() => run(state, 'person-3', 'onboarding.review', data), { status: 403 });
  for (const outcome of ['accepted', 'verified', 'approved', 'withdrawn']) assert.throws(() => review(state, outcome), { status: 400 });
  for (const reason of ['', '   ', null, 'x'.repeat(1001)]) assert.throws(() => review(state, 'ready-for-checks', reason), { status: 400 });
  state = review(state, 'changes-requested', '  Please discuss the privacy example.  ');
  assert.equal(state.onboardingCases[0].reviews[0].reason, 'Please discuss the privacy example.');
  assert.throws(() => review(state, 'ready-for-checks'), { status: 409 });
  state = run(state, 'person-1', 'onboarding.submit', { ...policy, caseId: state.onboardingCases[0].id, answers: { ...answers, privacy: 'discuss-support' } });
  state = review(state, 'ready-for-checks');
  assert.equal(state.onboardingCases[0].status, 'ready-for-checks');
  assert.deepEqual(state.onboardingCases[0].reviews.map(item => item.outcome), ['changes-requested', 'ready-for-checks']);
  assert.ok(state.onboardingCases[0].reviews.every(item => item.reviewerId === 'person-2' && item.reviewedAt === when.toISOString()));
  assert.equal(state.onboardingCases[0].answers.privacy, 'discuss-support', 'asking for support is not scored as a failed answer');
  assert.deepEqual(state.memberships, initial.memberships);
  assert.deepEqual(state.people, initial.people);
  assert.equal(projectState(state, actorFor(state, 'person-1'), 'demo').billing.enabled, false);
  assert.throws(() => submit(state), { status: 409 });
  assert.throws(() => review(state, 'changes-requested'), { status: 409 });
  const organiserCase = submit(start(createDemoState(), 'person-2'), 'person-2');
  assert.throws(() => run(organiserCase, 'person-2', 'onboarding.review', { ...data, caseId: organiserCase.onboardingCases[0].id }), /Another organiser/);
});

test('withdrawal is owner-only, preserves review history and permits a separate fresh rehearsal', () => {
  let state = review(submit(start()), 'ready-for-checks');
  const caseId = state.onboardingCases[0].id;
  assert.throws(() => run(state, 'person-2', 'onboarding.withdraw', { caseId }), { status: 403 });
  const before = structuredClone(state.onboardingCases[0]);
  state = run(state, 'person-1', 'onboarding.withdraw', { caseId });
  assert.deepEqual(state.onboardingCases[0], { ...before, status: 'withdrawn' });
  assert.throws(() => run(state, 'person-1', 'onboarding.withdraw', { caseId }), { status: 409 });
  assert.throws(() => run(state, 'person-1', 'onboarding.submit', { ...policy, caseId, answers }), { status: 409 });
  assert.throws(() => review(state, 'ready-for-checks'), { status: 409 });
  state = start(state);
  assert.equal(state.onboardingCases.length, 2);
  assert.notEqual(state.onboardingCases[1].id, caseId);
});

test('rehearsal records are private, scoped and absent outside demo; projections cannot mutate state or policy', () => {
  let state = submit(start());
  state = start(state, 'person-3');
  const member = actorFor(state, 'person-1');
  const own = projectState(state, member, 'demo').onboarding;
  assert.equal(own.enabled, true);
  assert.deepEqual(own.cases.map(item => item.personId), ['person-1']);
  assert.equal(projectState(state, actorFor(state, 'person-2'), 'demo').onboarding.cases.length, 2);
  assert.deepEqual(projectState(state, null, 'demo').onboarding.cases, []);
  for (const mode of ['pilot', 'live', undefined]) {
    const projected = projectState(state, actorFor(state, 'person-2'), mode).onboarding;
    assert.equal(projected.enabled, false);
    assert.deepEqual(projected.cases, []);
  }
  const publicData = JSON.stringify(publicProjection(state, 'demo'));
  assert.equal(publicData.includes(state.onboardingCases[0].id), false);
  assert.equal(publicData.includes('check-source'), false);
  own.cases[0].answers.evidence = 'changed';
  own.questions[0].options[0].label = 'changed';
  assert.equal(state.onboardingCases[0].answers.evidence, answers.evidence);
  assert.notEqual(onboardingQuestions[0].options[0].label, 'changed');
});

const post = body => new Request('https://membership.example.test/api/commands', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://membership.example.test' }, body: JSON.stringify(body) });
function httpContext(mode, actorId = 'person-1', initial = createDemoState()) {
  let state = initial;
  return {
    mode, workspace: false,
    getActor: async (_request, current) => actorFor(current, actorId),
    store: { read: async () => state, compareAndSwap: async (revision, next) => { if (state.revision !== revision) return false; state = next; return true; } },
  };
}

test('HTTP forwards trusted mode, blocks legacy admission outside demo and retains self-withdrawal', async () => {
  const rehearsal = { ...policy, acknowledged: true, mode: 'demo' };
  for (const mode of ['pilot', 'live', undefined]) {
    const ctx = httpContext(mode);
    const state = await ctx.store.read();
    for (const [type, data] of [['onboarding.start', rehearsal], ['membership.apply', { acknowledged: true }], ['membership.review', { membershipId: 'membership-1', status: 'accepted' }]]) {
      const response = await api(post({ ...makeCommand(state, type, data), mode: 'demo' }), ctx);
      assert.equal(response.status, 403, `${mode}: ${type}`);
    }
    assert.equal((await ctx.store.read()).revision, state.revision);
    const organiser = httpContext(mode, 'person-2');
    const reviewResponse = await api(post(makeCommand(await organiser.store.read(), 'membership.review', { membershipId: 'membership-1', status: 'accepted' })), organiser);
    assert.equal(reviewResponse.status, 403, 'a real organiser still cannot bypass admission gates');
    assert.match((await reviewResponse.json()).error, /required checks/);
    assert.equal((await organiser.store.read()).memberships[0].status, 'pending');
    const owner = httpContext(mode, 'person-3');
    const response = await api(post(makeCommand(await owner.store.read(), 'membership.withdraw', { membershipId: 'membership-1' })), owner);
    assert.equal(response.status, 200);
    assert.equal((await owner.store.read()).memberships[0].status, 'withdrawn');
  }
  const ctx = httpContext('demo');
  assert.equal((await api(post(makeCommand(await ctx.store.read(), 'onboarding.start', rehearsal)), ctx)).status, 200);
  assert.equal((await ctx.store.read()).onboardingCases.length, 1);
  assert.equal((await api(post(makeCommand(await ctx.store.read(), 'membership.apply', { acknowledged: true })), ctx)).status, 200, 'legacy demonstration remains available');
  const state = await ctx.store.read();
  const bootstrap = await api(new Request('https://membership.example.test/api/bootstrap'), ctx);
  assert.equal((await bootstrap.json()).onboarding.cases.length, 1);
  ctx.store.compareAndSwap = async () => false;
  assert.equal((await api(post(makeCommand(state, 'onboarding.submit', { ...policy, caseId: state.onboardingCases[0].id, answers })), ctx)).status, 409);
  assert.equal((await ctx.store.read()).onboardingCases[0].status, 'draft');
});

test('browser preview uses the same rehearsal rules and each visitor has separate fictional cases', async () => {
  const preview = createPreviewApi({ now: () => when });
  const request = body => ({ method: 'POST', body: JSON.stringify(body) });
  const changeRole = role => preview('/api/demo/session', request({ role }));
  const command = async (type, data) => {
    const state = await preview('/api/bootstrap');
    return preview('/api/commands', request(makeCommand(state, type, data)));
  };
  await assert.rejects(command('onboarding.start', { ...policy, acknowledged: true }), { status: 401 });
  await changeRole('member');
  await command('onboarding.start', { ...policy, acknowledged: true });
  const caseId = (await preview('/api/bootstrap')).onboarding.cases[0].id;
  await command('onboarding.submit', { ...policy, caseId, answers });
  await assert.rejects(command('onboarding.review', { caseId, outcome: 'ready-for-checks', reason: 'Not independent.' }), { status: 403 });
  await changeRole('organiser');
  await command('onboarding.review', { caseId, outcome: 'ready-for-checks', reason: 'Fictional review, separate checks still required.' });
  assert.equal((await preview('/api/export')).onboarding.cases[0].status, 'ready-for-checks');
  await changeRole('public');
  assert.deepEqual((await preview('/api/bootstrap')).onboarding.cases, []);
  assert.deepEqual((await createPreviewApi({ now: () => when })('/api/bootstrap')).onboarding.cases, []);
});
