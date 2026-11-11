-- FICTIONAL PRIVATE PILOT ONLY. Apply to its dedicated D1 database.
-- Source fixtures are inserted once by src/pilot-store.mjs on the first read.
-- No existing production/Workspace table or register is read or changed.
CREATE TABLE IF NOT EXISTS p4a_pilot_snapshot (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  revision INTEGER NOT NULL CHECK (revision >= 0),
  snapshot_json TEXT NOT NULL
    CHECK (length(CAST(snapshot_json AS BLOB)) <= 1048576)
    CHECK (json_valid(snapshot_json))
    CHECK (json_type(snapshot_json, '$.revision') IS 'integer')
    CHECK (json_extract(snapshot_json, '$.revision') = revision),
  data_mode TEXT NOT NULL DEFAULT 'fictional' CHECK (data_mode = 'fictional'),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
