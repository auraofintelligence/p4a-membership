// Private pilot only. The production Worker never imports this adapter.
// Keep this whole-state store separate from a future live membership database.
import { emptyState, normaliseState } from './domain.mjs';

export const PILOT_MAX_SNAPSHOT_BYTES = 1024 * 1024;
const encoder = new TextEncoder();
const collections = ['people', 'groups', 'projects', 'memberships', 'contributions', 'financialContributions', 'decisions', 'constitutions', 'activity', 'processed'];
const readSQL = 'SELECT revision, snapshot_json, data_mode FROM p4a_private_pilot_snapshot WHERE singleton = 1';
const seedSQL = "INSERT OR IGNORE INTO p4a_private_pilot_snapshot (singleton, revision, snapshot_json, data_mode) VALUES (1, ?1, ?2, 'private')";
const swapSQL = "UPDATE p4a_private_pilot_snapshot SET revision = ?1, snapshot_json = ?2, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE singleton = 1 AND revision = ?3 AND data_mode = 'private'";

function bootstrapProfile(organiser) {
  if (!organiser || organiser.id !== 'pilot-organiser' || typeof organiser.name !== 'string' || !organiser.name.trim() || organiser.name.length > 100) throw new Error('The private pilot needs its explicitly supplied organiser identity and name.');
  if (organiser.email !== undefined && typeof organiser.email !== 'string') throw new Error('The organiser email must be a valid address or omitted.');
  const email = (organiser.email ?? '').trim().toLowerCase();
  if (email.length > 254 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) throw new Error('The organiser email must be a valid address or omitted.');
  return { id: 'pilot-organiser', name: organiser.name.trim(), email, role: 'organiser', place: '', skills: '', interests: '', directoryConsent: false, contactConsent: false };
}

function encodeState(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state) || !Number.isSafeInteger(state.revision) || state.revision < 0) throw new Error('Invalid pilot state revision.');
  const normalised = normaliseState(state);
  if (!collections.every(key => Array.isArray(normalised[key]))) throw new Error('Invalid pilot state collections.');
  let json;
  try { json = JSON.stringify(normalised); } catch { throw new Error('Pilot state must be serialisable JSON.'); }
  if (encoder.encode(json).byteLength > PILOT_MAX_SNAPSHOT_BYTES) throw new Error('The private pilot snapshot has reached its 1 MiB limit. Export and review capacity before continuing.');
  return json;
}

function changedRows(result) {
  if (result?.success !== true || ![0, 1].includes(result.meta?.changes)) throw new Error('Pilot storage did not confirm the write. Retry the original command ID.');
  return result.meta.changes;
}

function decodeRow(row) {
  if (!row || row.data_mode !== 'private' || typeof row.snapshot_json !== 'string' || !Number.isSafeInteger(row.revision) || row.revision < 0) throw new Error('The private pilot snapshot is missing or invalid.');
  if (encoder.encode(row.snapshot_json).byteLength > PILOT_MAX_SNAPSHOT_BYTES) throw new Error('The private pilot snapshot exceeds its size limit.');
  let state;
  try { state = JSON.parse(row.snapshot_json); } catch { throw new Error('The private pilot snapshot is not valid JSON.'); }
  encodeState(state);
  if (state.revision !== row.revision) throw new Error('The pilot snapshot revision does not match its stored revision.');
  return normaliseState(state);
}

export function pilotStore(env, organiser) {
  if (env?.PILOT_MODE !== 'private') throw new Error('The pilot store requires explicit private mode.');
  const database = env.PILOT_DB;
  if (!database || typeof database.prepare !== 'function') throw new Error('The dedicated PILOT_DB binding is missing.');
  const organiserProfile = bootstrapProfile(organiser);

  return {
    async read() {
      let row = await database.prepare(readSQL).first();
      if (!row) {
        // Concurrent first readers may all attempt this insert. Only one wins;
        // never replace an existing snapshot or copy old fictional/local data.
        const seed = emptyState();
        seed.people.push(organiserProfile);
        changedRows(await database.prepare(seedSQL).bind(seed.revision, encodeState(seed)).run());
        row = await database.prepare(readSQL).first();
      }
      return decodeRow(row);
    },
    async compareAndSwap(expectedRevision, nextState) {
      if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0 || !Number.isSafeInteger(expectedRevision + 1) || nextState?.revision !== expectedRevision + 1) throw new Error('Invalid pilot compare-and-swap revision.');
      const json = encodeState(nextState);
      // A single conditional SQL statement owns the entire write. An obsolete
      // writer changes zero rows; it cannot overwrite a newer command receipt.
      const result = await database.prepare(swapSQL).bind(nextState.revision, json, expectedRevision).run();
      return changedRows(result) === 1;
    },
  };
}
