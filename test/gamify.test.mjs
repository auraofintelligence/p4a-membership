import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { actorFor, executeCommand, gamifyProjection, normaliseState, projectState } from '../src/domain.mjs';
import { createDemoState } from '../src/seed.mjs';
import { api } from '../src/http.mjs';

globalThis.crypto ??= webcrypto;
const when = new Date('2026-11-07T10:00:00.000Z');
const cmd = (state, type, data, id = crypto.randomUUID()) => ({ id, revision: state.revision, type, data });
const apply = (state, actorId, type, data) => executeCommand(state, actorFor(state, actorId), cmd(state, type, data), when).state;
const payment = (extra = {}) => ({ projectId: 'project-1', date: '2026-11-06', amountCents: 12500, category: 'donation', reference: 'EXAMPLE-PRIVATE-RECEIPT', description: 'Fictional receipt evidence for this test only.', publicConsent: false, namedConsent: false, ...extra });
const logged = (extra = {}, state = createDemoState()) => apply(state, 'person-1', 'financial.log', payment(extra));
const reviewed = state => apply(state, 'person-2', 'financial.review', { contributionId: state.financialContributions.at(-1).id, status: 'verified', settled: true, reason: 'Fictional settled receipt independently checked.' });
const board = state => gamifyProjection(state, {}, 'demo', when);

test('legacy data gains an empty financial collection without adding names, consent, samples or mutating state', () => {
  const state = createDemoState();
  delete state.financialContributions;
  state.contributions[0].status = 'verified';
  state.contributions[0].publicConsent = true;
  const original = structuredClone(state);
  const normalised = normaliseState(state);
  assert.deepEqual(state, original);
  assert.deepEqual(normalised.financialContributions, []);
  assert.equal(board(normalised).hours.length, 0);
  assert.equal(board(normalised).totals.hours, 1.5);
  assert.equal(normalised.contributions[0].namedConsent, undefined);
  assert.throws(() => normaliseState({ ...state, financialContributions: null }), /register is invalid/);
});

test('financial submission requires integer AUD cents, valid dates and categories, accessible projects and unique references', () => {
  for (const amountCents of [0, -1, 12.5, Number.NaN, Infinity, 1_000_000_001, '1200']) assert.throws(() => logged({ amountCents }), /AUD amount/);
  assert.throws(() => logged({ date: '2026-11-08' }), /valid date/);
  assert.throws(() => logged({ date: '2026-02-30' }), /valid date/);
  assert.throws(() => logged({ category: 'paid-work' }), /category/);
  assert.throws(() => logged({ reference: '' }), /reference/);
  let state = logged();
  assert.equal(state.financialContributions[0].currency, 'AUD');
  assert.equal(state.financialContributions[0].status, 'pending');
  assert.equal(state.financialContributions[0].createdBy, 'person-1');
  assert.throws(() => logged({ reference: '  example-private-receipt  ' }, state), /already been recorded/);
  assert.throws(() => apply(createDemoState(), 'person-3', 'financial.log', payment()), /Join the working group/);
});

test('receipt creator and contributor cannot review; verified financial evidence requires settled acknowledgement and reason', () => {
  const state = logged(), contributionId = state.financialContributions[0].id;
  assert.throws(() => apply(state, 'person-1', 'financial.review', { contributionId, status: 'verified', settled: true, reason: 'Self approval' }), /organiser/);
  assert.throws(() => apply(state, 'person-2', 'financial.review', { contributionId, status: 'verified', reason: 'No settlement' }), /settled/);
  assert.throws(() => apply(state, 'person-2', 'financial.review', { contributionId, status: 'verified', settled: true, reason: '' }), /reason/);
  const result = reviewed(state);
  assert.equal(result.financialContributions[0].verifierId, 'person-2');
  assert.equal(result.financialContributions[0].history[0].before.status, 'pending');
  assert.throws(() => reviewed(result), /already been reviewed/);
  const recordedByOrganiser = apply(createDemoState(), 'person-2', 'financial.log', payment({ personId: 'person-3' }));
  assert.throws(() => reviewed(recordedByOrganiser), /made or recorded/);
  const ownOrganiser = apply(createDemoState(), 'person-2', 'financial.log', payment());
  assert.throws(() => reviewed(ownOrganiser), /made or recorded/);
});

test('only contributors can choose named visibility, separately from directory and aggregate consent', () => {
  let state = reviewed(logged({ publicConsent: true }));
  const contributionId = state.financialContributions[0].id;
  state.people[0].directoryConsent = true;
  assert.equal(board(state).money.length, 0);
  assert.equal(board(state).totals.moneyCents, 12500);
  assert.throws(() => apply(state, 'person-2', 'financial.sharing', { contributionId, publicConsent: true, namedConsent: true }), /Only the contributor/);
  state = apply(state, 'person-1', 'financial.sharing', { contributionId, publicConsent: false, namedConsent: true });
  assert.equal(board(state).money[0].name, 'Alex River');
  assert.equal(board(state).totals.moneyCents, 12500, 'named-only consent authorises its public amount without excluding it from totals');
  state = apply(state, 'person-1', 'financial.sharing', { contributionId, publicConsent: false, namedConsent: false });
  assert.equal(board(state).money.length, 0);
  assert.equal(board(state).totals.moneyCents, 0);
  assert.equal(state.financialContributions[0].status, 'verified', 'privacy withdrawal is separate from validity');
  assert.throws(() => apply(createDemoState(), 'person-2', 'financial.log', payment({ personId: 'person-3', namedConsent: true })), /Only the contributor/);
});

test('public boards contain only verified named receipt summaries and exclude sensitive provenance', () => {
  let state = reviewed(logged({ namedConsent: true }));
  state.people[0].authSubject = 'SECRET-SUBJECT';
  const visible = board(state);
  assert.deepEqual(visible.money[0], { rank: 1, name: 'Alex River', totalCents: 12500, receiptCount: 1, projects: [{ id: 'project-1', title: state.projects[0].title, totalCents: 12500, receiptCount: 1 }] });
  const json = JSON.stringify(visible);
  for (const secret of ['person-1', 'person-2', 'alex@example.invalid', 'SECRET-SUBJECT', 'EXAMPLE-PRIVATE-RECEIPT', state.financialContributions[0].description, state.financialContributions[0].id]) assert.equal(json.includes(secret), false, secret);
  state = logged({ reference: 'PENDING-OTHER-RECEIPT', amountCents: 50000, namedConsent: true }, state);
  assert.equal(board(state).totals.moneyCents, 12500, 'pending money cannot rank or inflate totals');
});

test('private financial exports are role scoped and supply net/refunded cents without public raw records', () => {
  const state = reviewed(logged());
  const member = projectState(state, actorFor(state, 'person-1'));
  assert.equal(member.financialContributions[0].reference, 'EXAMPLE-PRIVATE-RECEIPT');
  assert.equal(member.financialContributions[0].netCents, 12500);
  assert.equal(member.financialContributions[0].refundedCents, 0);
  assert.equal(projectState(state, actorFor(state, 'person-3')).financialContributions.length, 0);
  assert.equal(projectState(state, actorFor(state, 'person-2')).financialContributions.length, 1);
  assert.equal(projectState(state, null).financialContributions.length, 0);
});

test('partial and full refunds preserve original receipts, reject excess/duplicate adjustments, and reduce totals immediately', () => {
  let state = reviewed(logged({ namedConsent: true }));
  const contributionId = state.financialContributions[0].id;
  const data = { contributionId, amountCents: 2500, reference: 'PARTIAL-REFUND', reason: 'Verified partial reversal in the example ledger.' };
  assert.throws(() => apply(state, 'person-1', 'financial.refund', data), /organiser/);
  assert.throws(() => apply(state, 'person-2', 'financial.refund', { ...data, amountCents: 12501 }), /exceeds/);
  state = apply(state, 'person-2', 'financial.refund', data);
  assert.equal(state.financialContributions[0].amountCents, 12500);
  assert.equal(board(state).money[0].totalCents, 10000);
  assert.equal(board(state).totals.moneyCents, 10000);
  assert.throws(() => apply(state, 'person-2', 'financial.refund', data), /already been recorded/);
  const privateReceipt = projectState(state, actorFor(state, 'person-1')).financialContributions[0];
  assert.equal(privateReceipt.refundedCents, 2500);
  assert.equal(privateReceipt.netCents, 10000);
  state = apply(state, 'person-2', 'financial.refund', { ...data, amountCents: 10000, reference: 'FINAL-REFUND' });
  assert.equal(board(state).money.length, 0);
  assert.equal(board(state).totals.moneyReceipts, 0);
  assert.equal(state.financialContributions[0].refunds.length, 2);
});

test('replayed receipt and refund commands cannot record the financial event twice', () => {
  let state = createDemoState();
  const request = cmd(state, 'financial.log', payment({ namedConsent: true }));
  state = executeCommand(state, actorFor(state, 'person-1'), request, when).state;
  const replay = executeCommand(state, actorFor(state, 'person-1'), request, when);
  assert.equal(replay.result.replayed, true);
  assert.equal(replay.state.financialContributions.length, 1);
  state = reviewed(state);
  const refundRequest = cmd(state, 'financial.refund', { contributionId: state.financialContributions[0].id, amountCents: 500, reference: 'REFUND-REPLAY', reason: 'Example verified adjustment.' });
  state = executeCommand(state, actorFor(state, 'person-2'), refundRequest, when).state;
  const refundReplay = executeCommand(state, actorFor(state, 'person-2'), refundRequest, when);
  assert.equal(refundReplay.result.replayed, true);
  assert.equal(refundReplay.state.financialContributions[0].refunds.length, 1);
  assert.equal(board(refundReplay.state).totals.moneyCents, 12000);
});

test('financial corrections require provenance, clear public recognition and independently re-enter review', () => {
  let state = reviewed(logged({ namedConsent: true }));
  const contributionId = state.financialContributions[0].id;
  const correction = { ...payment({ amountCents: 13000 }), contributionId, reason: 'Corrected the example amount from original evidence.' };
  assert.throws(() => apply(state, 'person-3', 'financial.correct', correction), /Only the contributor/);
  state = apply(state, 'person-1', 'financial.correct', correction);
  const receipt = state.financialContributions[0];
  assert.equal(receipt.history.at(-1).before.amountCents, 12500);
  assert.equal(receipt.status, 'pending');
  assert.equal(receipt.verifierId, null);
  assert.equal(receipt.publicConsent, false);
  assert.equal(receipt.namedConsent, false);
  assert.equal(board(state).totals.moneyCents, 0);
  state = reviewed(state);
  assert.equal(board(state).totals.moneyCents, 0, 'review does not silently restore prior disclosure');
  state = apply(state, 'person-1', 'financial.sharing', { contributionId, publicConsent: false, namedConsent: true });
  assert.equal(board(state).totals.moneyCents, 13000);
});

test('verified financial receipts can be independently revoked; refunded receipts cannot be silently rewritten', () => {
  let state = reviewed(logged({ namedConsent: true }));
  const contributionId = state.financialContributions[0].id;
  state = apply(state, 'person-2', 'financial.refund', { contributionId, amountCents: 100, reference: 'REFUND-BEFORE-REVOKE', reason: 'Fictional partial refund.' });
  assert.throws(() => apply(state, 'person-1', 'financial.correct', { ...payment(), contributionId, reason: 'Rewrite' }), /cannot be rewritten/);
  assert.throws(() => apply(state, 'person-1', 'financial.revoke', { contributionId, reason: 'Own revocation' }), /organiser/);
  state = apply(state, 'person-2', 'financial.revoke', { contributionId, reason: 'Evidence requires reconciliation.' });
  assert.equal(board(state).money.length, 0);
  assert.equal(board(state).totals.moneyCents, 0);
  assert.equal(state.financialContributions[0].history.at(-1).before.status, 'verified');
});

test('voluntary recognition supports owner-only choice, independent revocation and corrections without monetary conversion', () => {
  let state = createDemoState();
  const contributionId = state.contributions[0].id;
  state = apply(state, 'person-2', 'contribution.review', { contributionId, status: 'verified' });
  state = apply(state, 'person-1', 'contribution.sharing', { contributionId, publicConsent: false, namedConsent: true });
  assert.equal(board(state).hours[0].totalHours, 1.5);
  assert.equal(board(state).totals.moneyCents, 0);
  assert.throws(() => apply(state, 'person-2', 'contribution.sharing', { contributionId, publicConsent: true, namedConsent: false }), /Only the contributor/);
  state = apply(state, 'person-2', 'contribution.revoke', { contributionId, reason: 'The example duration needs correction.' });
  assert.equal(board(state).hours.length, 0);
  assert.throws(() => apply(state, 'person-2', 'contribution.correct', { contributionId, hours: 2, date: '2026-11-06', description: 'Corrected', reason: 'Edit someone else' }), /Only the contributor/);
  state = apply(state, 'person-1', 'contribution.correct', { contributionId, hours: 2, date: '2026-11-06', description: 'Corrected fictional voluntary research duration.', reason: 'Corrected time record.' });
  assert.equal(state.contributions[0].status, 'pending');
  assert.equal(state.contributions[0].namedConsent, false);
  assert.equal(state.contributions[0].history.at(-1).before.hours, 1.5);
  assert.equal(board(state).hours.length, 0);
});

test('voluntary correction cannot introduce duplicate receipts or more than a day of recorded human time', () => {
  let state = createDemoState();
  state = apply(state, 'person-1', 'contribution.log', { projectId: 'project-1', date: '2026-11-05', hours: 23, description: 'Fictional long event for a boundary test.' });
  const contributionId = state.contributions[0].id;
  assert.throws(() => apply(state, 'person-1', 'contribution.correct', { contributionId, date: '2026-11-05', hours: 2, description: 'Would exceed daily limit', reason: 'Boundary test' }), /24 hours/);
  assert.throws(() => apply(state, 'person-1', 'contribution.correct', { contributionId, date: '2026-11-05', hours: 23, description: 'Fictional long event for a boundary test.', reason: 'Duplicate test' }), /24 hours|already been recorded/);
});

test('named recognition cannot disclose a private project, including through voluntary log and receipt sharing', () => {
  const state = createDemoState();
  state.projects[0].public = false;
  assert.throws(() => logged({ namedConsent: true }, state), /public project/);
  assert.throws(() => apply(state, 'person-1', 'contribution.log', { projectId: 'project-1', date: '2026-11-05', hours: 1, description: 'Private example', namedConsent: true }), /public project/);
  assert.throws(() => apply(state, 'person-1', 'contribution.sharing', { contributionId: 'contribution-1', publicConsent: false, namedConsent: true }), /public project/);
});

test('public Gamify API is read-only, no-store and works without revealing a private bootstrap', async () => {
  const state = reviewed(logged({ namedConsent: true }));
  const context = { store: { read: async () => state }, getActor: async () => null, mode: 'demo', workspace: false };
  const response = await api(new Request('https://example.test/api/gamify?period=all'), context);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const body = await response.json();
  assert.equal(body.sampleData, true);
  assert.equal(body.period, 'all');
  assert.equal(body.money[0].name, 'Alex River');
  const invalid = await api(new Request('https://example.test/api/gamify?period=arbitrary'), context);
  assert.equal(invalid.status, 400);
  const exportResponse = await api(new Request('https://example.test/api/export'), context);
  assert.equal(exportResponse.status, 401);
});
