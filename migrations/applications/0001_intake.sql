-- Dedicated real application intake. No fixture records or membership grants.
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  email TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK (length(email) BETWEEN 3 AND 254),
  jurisdiction TEXT NOT NULL CHECK (jurisdiction IN ('act', 'nsw', 'nt', 'qld', 'sa', 'tas', 'vic', 'wa', 'outside')),
  policy_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'contacted', 'verification-pending', 'closed')),
  submitted_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_transition_id TEXT
);
CREATE INDEX IF NOT EXISTS applications_status_submitted ON applications (status, submitted_at, id);
CREATE TABLE IF NOT EXISTS application_audit (
  id TEXT PRIMARY KEY NOT NULL,
  application_id TEXT NOT NULL REFERENCES applications(id),
  from_status TEXT NOT NULL CHECK (from_status IN ('received', 'contacted', 'verification-pending')),
  to_status TEXT NOT NULL CHECK (to_status IN ('contacted', 'verification-pending', 'closed')),
  reason TEXT NOT NULL CHECK (length(trim(reason)) BETWEEN 1 AND 500),
  actor_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS application_audit_case ON application_audit (application_id, created_at, id);
