import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pilotStore, PILOT_MAX_SNAPSHOT_BYTES } from '../src/pilot-store.mjs';
import { actorFor, emptyState, executeCommand } from '../src/domain.mjs';

globalThis.crypto ??= webcrypto;
const organiser = { id: 'pilot-organiser', name: 'Test Operator', email: 'operator@example.invalid' };

function databaseDouble() {
  const database = { row: null, inserts: 0, updates: 0, failWrites: false, queries: [] };
  database.prepare = sql => {
    database.queries.push(sql);
    let values = [];
    return {
      bind(...parameters) { values = parameters; return this; },
      async first() {
        assert.equal(sql, 'SELECT revision, snapshot_json, data_mode FROM p4a_private_pilot_snapshot WHERE singleton = 1');
        return database.row ? { ...database.row } : null;
      },
      async run() {
        if (database.failWrites) return { success: false, meta: { changes: 0 } };
        if (sql.startsWith('INSERT OR IGNORE')) {
          assert.match(sql, /^INSERT OR IGNORE INTO p4a_private_pilot_snapshot .*VALUES \(1, \?1, \?2, 'private'\)$/);
          if (database.row) return { success: true, meta: { changes: 0 } };
          database.row = { revision: values[0], snapshot_json: values[1], data_mode: 'private' };
          database.inserts++;
          return { success: true, meta: { changes: 1 } };
        }
        assert.match(sql, /^UPDATE p4a_private_pilot_snapshot SET revision = \?1, snapshot_json = \?2,/);
        assert.match(sql, /WHERE singleton = 1 AND revision = \?3 AND data_mode = 'private'$/);
        if (!database.row || database.row.revision !== values[2] || database.row.data_mode !== 'private') return { success: true, meta: { changes: 0 } };
        database.row = { revision: values[0], snapshot_json: values[1], data_mode: 'private' };
        database.updates++;
        return { success: true, meta: { changes: 1 } };
      },
    };
  };
  return database;
}
const storeFor = (database, person = organiser) => pilotStore({ PILOT_MODE: 'private', PILOT_DB: database }, person);

test('pilot store requires the dedicated binding, private mode and explicit organiser identity', () => {
  assert.throws(() => pilotStore({}), /private mode/);
  assert.throws(() => pilotStore({ PILOT_MODE: 'fictional', PILOT_DB: databaseDouble() }, organiser), /private mode/);
  assert.throws(() => pilotStore({ PILOT_MODE: 'private' }, organiser), /PILOT_DB/);
  assert.throws(() => pilotStore({ PILOT_MODE: 'private', PILOT_DB: {} }, organiser), /PILOT_DB/);
  assert.throws(() => pilotStore({ PILOT_MODE: 'private', PILOT_DB: databaseDouble() }), /organiser identity/);
  assert.throws(() => storeFor(databaseDouble(), { id: 'person-2', name: 'Sample' }), /organiser identity/);
  assert.throws(() => storeFor(databaseDouble(), { ...organiser, name: '' }), /organiser identity/);
  assert.throws(() => storeFor(databaseDouble(), { ...organiser, email: 'invalid' }), /email/);
});

test('concurrent first reads initialise once with only the supplied organiser and no sample activity', async () => {
  const database = databaseDouble();
  const states = await Promise.all([storeFor(database).read(), storeFor(database).read(), storeFor(database).read()]);
  assert.equal(database.inserts, 1);
  const profile = { ...organiser, role: 'organiser', place: '', skills: '', interests: '', directoryConsent: false, contactConsent: false };
  assert.deepEqual(states[0], { ...emptyState(), people: [profile] });
  assert.equal(actorFor(states[0], 'person-1'), null);
  assert.equal(actorFor(states[0], 'person-2'), null);
  assert.equal(actorFor(states[0], 'pilot-organiser').role, 'organiser');
  states[0].people[0].name = 'Changed caller object';
  assert.equal(states[1].people[0].name, organiser.name);
  assert.equal((await storeFor(database, { ...organiser, name: 'Changed setup argument' }).read()).people[0].name, organiser.name);
  assert.ok(database.queries.every(sql => !/\bp4a_pilot_snapshot\b/.test(sql)), 'new code never queries the older fictional table');
});

test('optional organiser email stays empty without inventing a contact or granting disclosure', async () => {
  const database = databaseDouble();
  const state = await storeFor(database, { id: 'pilot-organiser', name: 'Test Operator' }).read();
  assert.equal(state.people[0].email, '');
  assert.equal(state.people[0].directoryConsent, false);
  assert.equal(state.people[0].contactConsent, false);
  assert.equal(state.memberships.length, 0);
  assert.equal(state.activity.length, 0);
});

test('atomic revision CAS permits one competing writer and never reseeds existing edits', async () => {
  const database = databaseDouble(), first = storeFor(database), second = storeFor(database);
  const state = await first.read();
  const left = { ...structuredClone(state), revision: 1 }, right = { ...structuredClone(state), revision: 1 };
  left.people[0].name = 'Test edit A'; right.people[0].name = 'Test edit B';
  const results = await Promise.all([first.compareAndSwap(0, left), second.compareAndSwap(0, right)]);
  assert.deepEqual(results.sort(), [false, true]);
  assert.equal(database.updates, 1);
  const saved = await storeFor(database).read();
  assert.equal(saved.revision, 1);
  assert.equal(saved.people[0].name, 'Test edit A');
  assert.equal(database.inserts, 1);
  assert.equal(await second.compareAndSwap(0, right), false);
});

test('persisted command receipts allow an uncertain-response retry without duplicate mutation', async () => {
  const database = databaseDouble(), store = storeFor(database), initial = await store.read();
  const command = { id: crypto.randomUUID(), revision: initial.revision, type: 'profile.update', data: { interests: 'Test persistence and retry' } };
  const outcome = executeCommand(initial, actorFor(initial, 'pilot-organiser'), command);
  assert.equal(await store.compareAndSwap(initial.revision, outcome.state), true);
  // The client lost the success response. A new request reads persisted state.
  const persisted = await storeFor(database).read();
  const replay = executeCommand(persisted, actorFor(persisted, 'pilot-organiser'), command);
  assert.equal(replay.result.replayed, true);
  assert.equal(persisted.processed.at(-1).id, command.id);
  assert.equal(persisted.people[0].interests, command.data.interests);
  assert.equal(persisted.activity.length, 1);
  assert.equal(database.updates, 1);
});

test('invalid revisions, corrupt records and oversized UTF-8 snapshots fail without replacing stored data', async () => {
  const database = databaseDouble(), store = storeFor(database), initial = await store.read();
  const before = { ...database.row };
  await assert.rejects(store.compareAndSwap(0, { ...initial, revision: 2 }), /revision/);
  await assert.rejects(store.compareAndSwap(-1, { ...initial, revision: 0 }), /revision/);
  await assert.rejects(store.compareAndSwap(0, { ...initial, revision: 1, people: null }), /collections/);
  await assert.rejects(store.compareAndSwap(0, { ...initial, revision: 1, oversized: '🙂'.repeat(PILOT_MAX_SNAPSHOT_BYTES / 4) }), /1 MiB/);
  assert.deepEqual(database.row, before);
  for (const corrupt of [{ ...before, snapshot_json: '{broken' }, { ...before, revision: 2 }, { ...before, data_mode: 'live' }]) {
    database.row = corrupt;
    await assert.rejects(store.read(), /snapshot/);
    assert.equal(database.inserts, 1, 'corruption is never replaced by initial state');
  }
});

test('database failures do not masquerade as successful or stale writes', async () => {
  const database = databaseDouble(), store = storeFor(database), initial = await store.read();
  database.failWrites = true;
  await assert.rejects(store.compareAndSwap(0, { ...initial, revision: 1 }), /did not confirm/);
  assert.equal(database.row.revision, 0);
  const unavailable = pilotStore({ PILOT_MODE: 'private', PILOT_DB: { prepare() { throw new Error('Migration missing'); } } }, organiser);
  await assert.rejects(unavailable.read(), /Migration missing/);
});

test('private cutover migration preserves old tables and constrains the new snapshot', async () => {
  const sql = await readFile(new URL('../migrations/pilot/0002_private_pilot_snapshot.sql', import.meta.url), 'utf8');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS p4a_private_pilot_snapshot/);
  assert.match(sql, /CHECK \(singleton = 1\)/);
  assert.match(sql, /CHECK \(data_mode = 'private'\)/);
  assert.match(sql, /json_extract\(snapshot_json, '\$\.revision'\) = revision/);
  assert.match(sql, /length\(CAST\(snapshot_json AS BLOB\)\) <= 1048576/);
  assert.doesNotMatch(sql, /\b(DROP|DELETE|REPLACE)\s/i);
  assert.doesNotMatch(sql, /\b(UPDATE|INSERT|ALTER)\s/i);
  const source = await readFile(new URL('../src/pilot-store.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /createDemoState|from ['"].*seed\.mjs/);
});
