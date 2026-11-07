import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { createDemoState } from '../src/seed.mjs';
import { actorFor, executeCommand, projectState, gamifyProjection } from '../src/domain.mjs';
import { api } from '../src/http.mjs';

globalThis.crypto ??= webcrypto;
const when = new Date('2026-11-07T10:00:00Z');
const apply = (state, actorId, type, data) => executeCommand(state, actorFor(state, actorId), { id: crypto.randomUUID(), revision: state.revision, type, data }, when).state;
const fields = (reference, overrides = {}) => ({ projectId: 'project-1', date: '2026-11-06', amountCents: 10000, category: 'donation', reference, description: 'Private supporting evidence', publicConsent: false, namedConsent: true, ...overrides });
function logAndVerify(state, actorId, data) {
  state = apply(state, actorId, 'financial.log', data);
  const id = state.financialContributions.at(-1).id;
  state = apply(state, 'person-2', 'financial.review', { contributionId: id, status: 'verified', reason: 'Independent review of settled example receipt', settled: true });
  return { state, id };
}

test('independent review: refunds restate the original period and recalculate competition ranks', () => {
  let state = createDemoState();
  state.groups[0].memberIds.push('person-3');
  let result = logAndVerify(state, 'person-1', fields('last-year', { date: '2025-12-31', amountCents: 20000 }));
  const olderId = result.id;
  result = logAndVerify(result.state, 'person-3', fields('this-year'));
  state = result.state;
  assert.deepEqual(gamifyProjection(state, {}, 'demo', when).money.map(row => [row.name, row.rank]), [['Alex River', 1], ['Casey Banks', 2]]);
  state = apply(state, 'person-2', 'financial.refund', { contributionId: olderId, amountCents: 10000, reference: 'old-year-adjustment', reason: 'Part of the original payment was refunded' });
  const all = gamifyProjection(state, {}, 'demo', when);
  const year = gamifyProjection(state, { period: 'year' }, 'demo', when);
  assert.equal(all.totals.moneyCents, 20000);
  assert.deepEqual(all.money.map(row => row.rank), [1, 1]);
  assert.equal(year.totals.moneyCents, 10000);
  assert.deepEqual(year.money.map(row => row.name), ['Casey Banks']);
  assert.equal(all.money.reduce((sum, row) => sum + row.totalCents, 0), all.totals.moneyCents);
});

test('independent review: correcting a receipt clears publication until renewed choice and independent review', () => {
  let { state, id } = logAndVerify(createDemoState(), 'person-1', fields('before-correction'));
  state = apply(state, 'person-1', 'financial.correct', { contributionId: id, ...fields('after-correction', { amountCents: 25000 }), reason: 'Corrected original amount and reference' });
  let board = gamifyProjection(state, {}, 'demo', when);
  assert.equal(board.totals.moneyCents, 0);
  assert.equal(board.money.length, 0);
  assert.equal(state.financialContributions[0].namedConsent, false);
  assert.throws(() => apply(state, 'person-1', 'financial.log', fields('BEFORE-CORRECTION')), /already been recorded/);
  state = apply(state, 'person-2', 'financial.review', { contributionId: id, status: 'verified', reason: 'Corrected receipt independently checked', settled: true });
  assert.equal(gamifyProjection(state, {}, 'demo', when).money.length, 0);
  state = apply(state, 'person-1', 'financial.sharing', { contributionId: id, publicConsent: false, namedConsent: true });
  board = gamifyProjection(state, {}, 'demo', when);
  assert.equal(board.money[0].totalCents, 25000);
  state = apply(state, 'person-2', 'financial.revoke', { contributionId: id, reason: 'Receipt is disputed pending investigation' });
  assert.equal(gamifyProjection(state, {}, 'demo', when).money.length, 0);
  assert.equal(state.financialContributions[0].history.some(event => event.action === 'correct'), true);
});

test('independent review: people with identical public names remain separate contributors', () => {
  let state = createDemoState();
  state.people[2].name = state.people[0].name;
  state.groups[0].memberIds.push('person-3');
  state = logAndVerify(state, 'person-1', fields('same-name-one')).state;
  state = logAndVerify(state, 'person-3', fields('same-name-two')).state;
  const board = gamifyProjection(state, {}, 'demo', when);
  assert.equal(board.money.length, 2);
  assert.deepEqual(board.money.map(row => row.totalCents), [10000, 10000]);
  assert.deepEqual(board.money.map(row => row.rank), [1, 1]);
  assert.equal(JSON.stringify(board.money).includes('person-'), false);
});

test('independent review: public endpoint rejects private filter probes without exposing private details', async () => {
  let state = createDemoState();
  state.groups.push({ id: 'secret-group', name: 'Secret working group', memberIds: ['person-1'] });
  state.projects.push({ ...state.projects[0], id: 'secret-project', title: 'Secret project title', public: false, groupId: 'secret-group' });
  state = logAndVerify(state, 'person-1', fields('secret-payment-reference', { projectId: 'secret-project', namedConsent: false, publicConsent: true })).state;
  const options = { store: { read: async () => state }, getActor: async () => null, mode: 'demo', workspace: false };
  const publicResponse = await api(new Request('http://localhost/api/gamify'), options);
  assert.equal(publicResponse.status, 200);
  const body = await publicResponse.text();
  for (const secret of ['secret-group', 'Secret working group', 'secret-project', 'Secret project title', 'secret-payment-reference', 'Private supporting evidence', '@example.invalid', 'person-1']) assert.equal(body.includes(secret), false, secret);
  for (const query of ['projectId=secret-project', 'groupId=secret-group']) {
    const response = await api(new Request(`http://localhost/api/gamify?${query}`), options);
    assert.equal(response.status, 400);
    assert.equal((await response.text()).includes('secret-'), false);
  }
  assert.equal(publicResponse.headers.get('cache-control'), 'no-store');
});

test('independent review: members cannot export another person financial evidence or sharing history', () => {
  let state = createDemoState();
  state.groups[0].memberIds.push('person-3');
  state = logAndVerify(state, 'person-3', fields('someone-elses-private-reference', { publicConsent: true })).state;
  const exported = projectState(state, actorFor(state, 'person-1'), 'demo');
  assert.equal(exported.financialContributions.length, 0);
  assert.equal(JSON.stringify(exported).includes('someone-elses-private-reference'), false);
  const publicBoard = gamifyProjection(state, {}, 'demo', when);
  assert.equal(publicBoard.money[0].name, 'Casey Banks');
  assert.equal(JSON.stringify(publicBoard).includes('someone-elses-private-reference'), false);
});

test('independent review: publishing a project does not implicitly publish its working group identity', () => {
  const state = createDemoState();
  state.groups[0].public = false;
  state.groups[0].name = 'Private deliberation group';
  const projection = gamifyProjection(state, {}, 'demo', when);
  assert.equal(projection.options.groups.some(group => group.id === 'group-1'), false);
  assert.equal(JSON.stringify(projection).includes('Private deliberation group'), false);
  assert.equal(projection.options.projects.find(project => project.id === 'project-1').groupId, '');
  assert.throws(() => gamifyProjection(state, { groupId: 'group-1' }, 'demo', when), /public working group/);
  assert.equal(gamifyProjection(state, { projectId: 'project-1' }, 'demo', when).options.projects.some(project => project.id === 'project-1'), true);
  state.groups[0].public = true;
  const published = gamifyProjection(state, { groupId: 'group-1' }, 'demo', when);
  assert.equal(published.options.groups.find(group => group.id === 'group-1').name, 'Private deliberation group');
  assert.equal(published.options.projects.find(project => project.id === 'project-1').groupId, 'group-1');
});
