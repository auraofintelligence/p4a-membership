# Fictional private pilot persistence

This directory belongs only to the isolated private Cloudflare pilot. It does not migrate the Google register, choose a production membership database or import `.local` data. Keep the pilot database separate from any live membership or identity store. Enter fictional review information only.

## Contract

- Import `pilotStore` from `src/pilot-store.mjs` in the separate pilot Worker.
- Bind its dedicated D1 database as `PILOT_DB`.
- Set `PILOT_MODE` to the exact string `fictional`. Missing mode or binding fails closed.
- Set that binding's `migrations_dir` to `migrations/pilot`; apply `0001_pilot_snapshot.sql` to the verified pilot database through its separate Wrangler configuration.
- The store exposes `read()` and `compareAndSwap(expectedRevision, nextState)`. The normal command flow reads first, executes the existing domain command, and conditionally saves its result.

The first read inserts `createDemoState()` once using `INSERT OR IGNORE`. It includes Alex River (`person-1`, member) and Sam Taylor (`person-2`, organiser), both fictional source fixtures. The insert never replaces existing pilot work. There is no reset endpoint, auto-generated live member, schema creation on a failed request or fallback to another database. Apply the migration before the first request.

One conditional SQL `UPDATE` checks the current revision and advances it by exactly one. Competing writers cannot both commit the same revision. Complete state, including command IDs and receipt fingerprints, stays together in the transaction. If a response is lost after a commit, reload the state and retry the original domain command ID; the existing replay logic returns success without duplicating its effect. A stale conflicting command remains a conflict.

## Deliberate bounds

The pilot stores one snapshot, limited to 1 MiB of UTF-8 JSON in both application checks and SQL constraints. The row carries an explicit fictional marker and its SQL revision must match the JSON revision. Invalid, oversized or corrupt data fails closed without reseeding or discarding existing work.

This is a bounded persistence adapter for reviewing the existing whole-state domain model. It is not a partitioned production CRM, a financial audit archive or an identity evidence store. Authentication, access policy, public/private projections and same-origin checks belong to the separate pilot Worker and existing application rules. A private route does not make the sample identities real memberships.

Run its focused checks with `node --test test/pilot-store.test.mjs`. They use an isolated D1 binding double; database deployment, permissions and Cloudflare runtime behaviour still require separate acceptance checks. The migration and its conditional SQL were also exercised against local SQLite during implementation.

References: [D1 prepared statements](https://developers.cloudflare.com/d1/worker-api/prepared-statements/) and [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/).
