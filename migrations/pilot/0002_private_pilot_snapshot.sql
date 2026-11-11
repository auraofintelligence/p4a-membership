-- PRIVATE PILOT CUTOVER. Apply to the dedicated pilot D1 database.
-- Start a separate empty register; the Worker supplies its actual organiser.
-- The older p4a_pilot_snapshot table and its rows are deliberately untouched.
CREATE TABLE IF NOT EXISTS p4a_private_pilot_snapshot (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  revision INTEGER NOT NULL CHECK (revision >= 0),
  snapshot_json TEXT NOT NULL
    CHECK (length(CAST(snapshot_json AS BLOB)) <= 1048576)
    CHECK (json_valid(snapshot_json))
    CHECK (json_type(snapshot_json, '$.revision') IS 'integer')
    CHECK (json_extract(snapshot_json, '$.revision') = revision),
  data_mode TEXT NOT NULL DEFAULT 'private' CHECK (data_mode = 'private'),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
