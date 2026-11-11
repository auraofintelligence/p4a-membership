import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pilotStore, PILOT_MAX_SNAPSHOT_BYTES } from '../src/pilot-store.mjs';
import { actorFor, executeCommand } from '../src/domain.mjs';
import { createDemoState } from '../src/seed.mjs';

globalThis.crypto ??= webcrypto;

function databaseDouble() {
  const database = { row: null, inserts: 0, updates: 0, failWrites: false, queries: [] };
  database.prepare = sql => {
    database.queries.push(sql);
    let values = [];
    return {
      bind(...parameters) { values = parameters; return this; },
      async first() {
        assert.equal(sql, 'SELECT revision, snapshot_json, data_mode FROM p4a_pilot_snapshot WHERE singleton = 1');
        return database.row ? { ...database.row } : null;
      },
      async run() {
        if (database.failWrites) return { success: false, meta: { changes: 0 } };
        if (sql.startsWith('INSERT OR IGNORE')) {
          assert.match(sql, /^INSERT OR IGNORE INTO p4a_pilot_snapshot .*VALUES \(1, \?1, \?2, 'fictional'\)$/);
          if (database.row) return { success: true, meta: { changes: 0 } };
          database.row = { revision: values[0], snapshot_json: values[1], data_mode: 'fictional' };
          database.inserts++;
          return { success: true, meta: { changes: 1 } };
        }
        assert.match(sql, /^UPDATE p4a_pilot_snapshot SET revision = \?1, snapshot_json = \?2,/);
        assert.match(sql, /WHERE singleton = 1 AND revision = \?3 AND data_mode = 'fictional'$/);
        if (!database.row || database.row.revision !== values[2] || database.row.data_mode !== 'fictional') return { success: true, meta: { changes: 0 } };
        database.row = { revision: values[0], snapshot_json: values[1], data_mode: 'fictional' };
        database.updates++;
        return { success: true, meta: { changes: 1 } };
      },
    };
  };
  return database;
}
const storeFor = database => pilotStore({ PILOT_MODE: 'fictional', PILOT_DB: database });

test('pilot store requires both dedicated binding and explicit fictional mode', () => {
  assert.throws(() => pilotStore({}), /fictional mode/);
  assert.throws(() => pilotStore({ PILOT_MODE: 'live', PILOT_DB: databaseDouble() }), /fictional mode/);
  assert.throws(() => pilotStore({ PILOT_MODE: 'fictional' }), /PILOT_DB/);
  assert.throws(() => pilotStore({ PILOT_MODE: 'fictional', PILOT_DB: {} }), /PILOT_DB/);
});

test('concurrent first reads initialise once with existing fictional source fixtures', async () => {
  const database = databaseDouble();
  const states = await Promise.all([storeFor(database).read(), storeFor(database).read(), storeFor(database).read()]);
  assert.equal(database.inserts, 1);
  assert.deepEqual(states[0], createDemoState());
  assert.equal(actorFor(states[0], 'person-1').role, 'member');
  assert.equal(actorFor(states[0], 'person-2').role, 'organiser');
  states[0].people[0].name = 'Changed caller object';
  assert.equal(states[1].people[0].name, 'Alex River');
  assert.equal((await storeFor(database).read()).people[0].name, 'Alex River');
});

test('atomic revision CAS permits one competing writer and never reseeds existing edits', async () => {
  const database = databaseDouble(), first = storeFor(database), second = storeFor(database);
  const state = await first.read();
  const left = { ...structuredClone(state), revision: 1 }, right = { ...structuredClone(state), revision: 1 };
  left.people[0].name = 'Fictional edit A'; right.people[0].name = 'Fictional edit B';
  const results = await Promise.all([first.compareAndSwap(0, left), second.compareAndSwap(0, right)]);
  assert.deepEqual(results.sort(), [false, true]);
  assert.equal(database.updates, 1);
  const saved = await storeFor(database).read();
  assert.equal(saved.revision, 1);
  assert.equal(saved.people[0].name, 'Fictional edit A');
  assert.equal(database.inserts, 1);
  assert.equal(await second.compareAndSwap(0, right), false);
});

test('persisted command receipts allow an uncertain-response retry without duplicate mutation', async () => {
  const database = databaseDouble(), store = storeFor(database), initial = await store.read();
  const command = { id: crypto.randomUUID(), revision: initial.revision, type: 'comment.add', data: { projectId: 'project-1', text: 'Fictional durable pilot review note.' } };
  const outcome = executeCommand(initial, actorFor(initial, 'person-1'), command);
  assert.equal(await store.compareAndSwap(initial.revision, outcome.state), true);
  // The client lost the success response. A new request reads persisted state.
  const persisted = await storeFor(database).read();
  const replay = executeCommand(persisted, actorFor(persisted, 'person-1'), command);
  assert.equal(replay.result.replayed, true);
  assert.equal(persisted.processed.at(-1).id, command.id);
  assert.equal(persisted.projects[0].comments.filter(comment => comment.text === command.data.text).length, 1);
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
    assert.equal(database.inserts, 1, 'corruption is never replaced by fixtures');
  }
});

test('database failures do not masquerade as successful or stale writes', async () => {
  const database = databaseDouble(), store = storeFor(database), initial = await store.read();
  database.failWrites = true;
  await assert.rejects(store.compareAndSwap(0, { ...initial, revision: 1 }), /did not confirm/);
  assert.equal(database.row.revision, 0);
  const unavailable = pilotStore({ PILOT_MODE: 'fictional', PILOT_DB: { prepare() { throw new Error('Migration missing'); } } });
  await assert.rejects(unavailable.read(), /Migration missing/);
});

test('pilot migration constrains the singleton, fictional marker, JSON revision and byte limit', async () => {
  const sql = await readFile(new URL('../migrations/pilot/0001_pilot_snapshot.sql', import.meta.url), 'utf8');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS p4a_pilot_snapshot/);
  assert.match(sql, /CHECK \(singleton = 1\)/);
  assert.match(sql, /CHECK \(data_mode = 'fictional'\)/);
  assert.match(sql, /json_extract\(snapshot_json, '\$\.revision'\) = revision/);
  assert.match(sql, /length\(CAST\(snapshot_json AS BLOB\)\) <= 1048576/);
  assert.doesNotMatch(sql, /\b(DROP|DELETE|REPLACE)\s/i);
});
