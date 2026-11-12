import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { actorFor, executeCommand, projectState } from '../src/domain.mjs';
import { api } from '../src/http.mjs';
import { createDemoState } from '../src/seed.mjs';

globalThis.crypto ??= webcrypto;
const command = (state, type, data) => ({ id: crypto.randomUUID(), revision: state.revision, type, data });
const apply = (state, actorId, type, data) => executeCommand(state, actorFor(state, actorId), command(state, type, data)).state;
const work = { kind: 'book', title: ' A favourite book ', note: ' It helped me see things differently. ' };

test('profile works are visible to signed-in teammates independently of the directory', async () => {
  let state = createDemoState();
  assert.deepEqual(projectState(state, actorFor(state, 'person-1')).memberProfiles, []);
  state = apply(state, 'person-1', 'profile.influence.add', { ...work, actorId: 'person-3', shared: false });
  const { id } = state.people[0].influences[0];
  const expected = [{ id: 'person-1', name: 'Alex River', influences: [{ id, kind: 'book', title: work.title.trim(), note: work.note.trim() }] }];
  assert.equal(state.people[0].directoryConsent, false);
  for (const actorId of ['person-1', 'person-2', 'person-3']) {
    const view = projectState(state, actorFor(state, actorId));
    assert.deepEqual(view.memberProfiles, expected);
    assert.ok(view.people.every(person => !('influences' in person)));
    if (actorId !== 'person-1') assert.equal(view.activity.some(item => item.type === 'profile.influence.add'), false);
  }
  const guest = projectState(state, null);
  assert.deepEqual(guest.memberProfiles, []);
  assert.equal(JSON.stringify(guest).includes(work.title.trim()), false);
  assert.equal('memberProfiles' in guest.public, false);

  const response = await api(new Request('https://example.invalid/api/export'), {
    store: { read: async () => state },
    getActor: () => actorFor(state, 'person-3'),
  });
  const exported = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(exported.memberProfiles, expected);
  assert.equal(exported.people.some(person => person.id === 'person-1'), false);
  assert.equal(JSON.stringify(exported).includes('alex@example.invalid'), false);
});

test('only the profile owner can edit or remove a work and replay cannot duplicate it', () => {
  const initial = createDemoState();
  const request = command(initial, 'profile.influence.add', work);
  let { state } = executeCommand(initial, actorFor(initial, 'person-1'), request);
  const replay = executeCommand(state, actorFor(state, 'person-1'), request);
  assert.equal(replay.result.replayed, true);
  assert.equal(replay.state.people[0].influences.length, 1);
  const influenceId = state.people[0].influences[0].id;
  const edited = { influenceId, kind: 'podcast', title: 'A new perspective', note: 'I came away with a better question.' };
  assert.throws(() => apply(state, 'person-2', 'profile.influence.update', edited), { status: 404 });
  assert.throws(() => apply(state, 'person-3', 'profile.influence.remove', { influenceId }), { status: 404 });
  state = apply(state, 'person-1', 'profile.influence.update', edited);
  assert.deepEqual(projectState(state, actorFor(state, 'person-3')).memberProfiles[0].influences, [{
    id: influenceId, kind: edited.kind, title: edited.title, note: edited.note,
  }]);
  state = apply(state, 'person-1', 'profile.influence.remove', { influenceId });
  assert.deepEqual(projectState(state, actorFor(state, 'person-3')).memberProfiles, []);
});

test('profile works require an allowed type, title and meaningful note', () => {
  const state = createDemoState();
  for (const invalid of [{ kind: 'other' }, { title: ' ' }, { title: 'x'.repeat(141) }, { note: '' }, { note: 'x'.repeat(601) }]) {
    assert.throws(() => apply(state, 'person-1', 'profile.influence.add', { ...work, ...invalid }), { status: 400 });
  }
  assert.equal(state.people[0].influences, undefined);
  for (const kind of ['book', 'tv', 'movie', 'song', 'art', 'podcast']) {
    const added = apply(state, 'person-1', 'profile.influence.add', { ...work, kind });
    assert.equal(added.people[0].influences[0].kind, kind);
  }
});
