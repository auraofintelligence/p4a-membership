# Private pilot persistence

This directory belongs to the isolated private Cloudflare pilot. It does not migrate the Google register, import `.local` records or establish a production membership database. The current pilot starts empty except for its actual organiser, explicitly supplied by the private Worker. It creates no sample people, groups, projects, constitutions, memberships or activity.

## Contract

- Import `pilotStore` from `src/pilot-store.mjs` in the separate pilot Worker.
- Bind its dedicated D1 database as `PILOT_DB` and set `PILOT_MODE` to the exact string `private`. Missing mode or binding fails closed.
- Call `pilotStore(env, organiser)` with `{ id: 'pilot-organiser', name, email? }` for the actual authorised organiser. The name is required; email is optional. No credentials or identity evidence belong in this argument.
- Set the binding's `migrations_dir` to `migrations/pilot`; apply the migrations to the verified pilot database through its separate Wrangler configuration. The current adapter requires `0002_private_pilot_snapshot.sql`.
- The store exposes `read()` and `compareAndSwap(expectedRevision, nextState)`. Read first, execute the existing domain command and conditionally save its result.

On first read, `INSERT OR IGNORE` initialises `emptyState()` and adds the supplied organiser with both directory and contact consent false. Optional profile fields are empty. This is application administration, not an assertion of political membership, office or completed identity proofing. The caller must bind access to the authorised person through the separate authentication layer.

The initialisation never replaces existing private work or updates an existing profile from later bootstrap arguments. There is no reset endpoint, sample import, schema creation on a failed request or fallback to another database.

## Separate-table cutover

Migration `0001_pilot_snapshot.sql` records the earlier fictional pilot table. Leave that migration intact. Migration `0002_private_pilot_snapshot.sql` creates a new table, `p4a_private_pilot_snapshot`, whose rows carry `data_mode = 'private'`. It does not delete, copy or modify the older `p4a_pilot_snapshot` table or any rows.

This permits old and new Worker versions to coexist during deployment without reading or overwriting each other's snapshots. The new store never queries the old table. Inspect the old revision and handle retention or deletion separately under the authorised cutover plan; applying the new migration alone is not deletion or archival of the old data. No external cutover is performed by this source change.

## Consistency and bounds

One conditional SQL `UPDATE` checks the current revision and advances it by exactly one. Competing writers cannot both commit the same revision. Complete state, including command IDs and receipt fingerprints, stays together in the transaction. If a response is lost after a commit, reload the state and retry the original domain command ID; the existing replay logic returns success without duplicating its effect. A stale conflicting command remains a conflict.

The pilot stores one snapshot, limited to 1 MiB of UTF-8 JSON in both application checks and SQL constraints. The row carries an explicit private marker and its SQL revision must match the JSON revision. Invalid, oversized or corrupt data fails closed without resetting work.

This remains a bounded whole-state pilot adapter, not a partitioned production CRM, a financial audit archive or an identity evidence store. Authentication, access policy, public/private projections and same-origin checks belong to the separate pilot Worker and existing application rules.

Run focused checks with `node --test test/pilot-store.test.mjs`. They use an isolated D1 binding double. Exact migration and conditional SQL are also checked against local SQLite during implementation; Cloudflare deployment, permissions and runtime behaviour require separate acceptance checks.

References: [D1 prepared statements](https://developers.cloudflare.com/d1/worker-api/prepared-statements/) and [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/).
