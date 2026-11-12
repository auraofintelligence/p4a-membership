import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { actorFor, emptyState, executeCommand, normaliseState, projectState, publicProjection } from '../src/domain.mjs';

globalThis.crypto ??= webcrypto;

const now = new Date('2026-11-11T14:05:00.000Z');
const game = { gameId: 'cooperative-board-game', title: 'Private game title', playedOn: '2026-11-12' };
const command = (state, type, data) => ({ id: crypto.randomUUID(), revision: state.revision, type, data });
const run = (state, actorId, request) => executeCommand(state, actorFor(state, actorId), request, now);
const apply = (state, actorId, type, data) => run(state, actorId, command(state, type, data)).state;
const view = (state, actorId) => projectState(state, actorFor(state, actorId));

function workspace() {
  const state = emptyState();
  state.people = [
    { id: 'member-1', name: 'Member One', role: 'member' },
    { id: 'member-2', name: 'Member Two', role: 'member' },
    { id: 'organiser', name: 'Organiser', role: 'organiser' },
  ];
  return state;
}

test('old workspace snapshots load with empty participation data', () => {
  const state = workspace();
  for (const key of ['learningCompletions', 'gamePlays', 'gamifyIdeas']) {
    delete state[key];
    assert.deepEqual(normaliseState(state)[key], []);
    assert.throws(() => normaliseState({ ...state, [key]: null }), { status: 503 });
  }
  const saved = apply(state, 'member-1', 'training.complete', { moduleId: 'take-your-first-step' });
  assert.deepEqual(view(JSON.parse(JSON.stringify(saved)), 'member-1').myLearning, ['take-your-first-step']);
  assert.deepEqual(view(saved, 'member-1').myGamePlays, []);
  assert.deepEqual(view(saved, 'member-1').gamifyIdeas, []);
});

test('members can mark their own training completion once per module', () => {
  const data = { moduleId: 'take-your-first-step', personId: 'member-2' };
  let state = workspace();
  const request = command(state, 'training.complete', data);
  state = run(state, 'member-1', request).state;
  assert.equal(run(state, 'member-1', request).result.replayed, true);
  state = apply(state, 'member-1', 'training.complete', data);
  assert.deepEqual(view(state, 'member-1').myLearning, ['take-your-first-step']);
  assert.deepEqual(view(state, 'member-2').myLearning, []);
  state = apply(state, 'member-2', 'training.complete', data);
  assert.deepEqual(view(state, 'member-1').myLearning, ['take-your-first-step']);
  assert.deepEqual(view(state, 'member-2').myLearning, ['take-your-first-step']);
  assert.deepEqual(view(state, 'organiser').myLearning, []);
  assert.deepEqual(view(state, 'organiser').activity, []);
  assert.throws(() => apply(state, 'member-1', 'training.complete', { moduleId: '../training' }), { status: 400 });
});

test('team game records remain private and use the Brisbane calendar date', () => {
  let state = workspace();
  const request = command(state, 'team-game.record', { ...game, personId: 'member-2' });
  state = run(state, 'member-1', request).state;
  const replay = run(state, 'member-1', request);
  assert.equal(replay.result.replayed, true);
  const [play] = view(replay.state, 'member-1').myGamePlays;
  assert.deepEqual(view(replay.state, 'member-1').myGamePlays, [{ id: play.id, ...game }]);
  assert.deepEqual(view(state, 'member-2').myGamePlays, []);
  assert.deepEqual(view(state, 'organiser').myGamePlays, []);
  assert.deepEqual(view(state, 'organiser').activity, []);
  assert.deepEqual(view(state, null).myGamePlays, []);
  assert.deepEqual(state.contributions, []);
  assert.equal(JSON.stringify(publicProjection(state)).includes(game.title), false);
  for (const actorId of ['member-2', 'organiser']) {
    assert.throws(() => apply(state, actorId, 'team-game.remove', { playId: play.id }), { status: 404 });
  }
  for (const playedOn of ['2026-11-13', '2026-02-30']) {
    assert.throws(() => apply(state, 'member-1', 'team-game.record', { ...game, playedOn }), { status: 400 });
  }
  state = apply(state, 'member-1', 'team-game.remove', { playId: play.id });
  assert.deepEqual(view(state, 'member-1').myGamePlays, []);
});

test('workspace ideas share content without author identities and only the author can withdraw', () => {
  let state = workspace();
  const idea = { title: 'Swap a skill', description: 'Pair members with different strengths to learn from one another.' };
  assert.throws(() => apply(state, null, 'gamify.idea.propose', idea), { status: 401 });
  assert.throws(() => apply(state, 'member-1', 'gamify.idea.propose', { ...idea, title: ' ' }), { status: 400 });
  assert.throws(() => apply(state, 'member-1', 'gamify.idea.propose', { ...idea, description: 'a'.repeat(2001) }), { status: 400 });
  state = apply(state, 'member-1', 'gamify.idea.propose', { ...idea, personId: 'organiser' });
  const [own] = view(state, 'member-1').gamifyIdeas;
  assert.deepEqual(own, { id: own.id, ...idea, createdAt: now.toISOString(), mine: true });
  for (const actorId of ['member-2', 'organiser']) {
    assert.deepEqual(view(state, actorId).gamifyIdeas, [{ ...own, mine: false }]);
    assert.deepEqual(view(state, actorId).activity, []);
    assert.throws(() => apply(state, actorId, 'gamify.idea.withdraw', { ideaId: own.id }), { status: 403 });
  }
  assert.deepEqual(view(state, null).gamifyIdeas, []);
  assert.equal(JSON.stringify(publicProjection(state)).includes(idea.title), false);
  state = apply(state, 'member-1', 'gamify.idea.withdraw', { ideaId: own.id });
  assert.deepEqual(view(state, 'member-2').gamifyIdeas, []);
});
