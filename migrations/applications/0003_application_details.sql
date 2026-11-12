-- Keep historic applications and their notice versions unchanged. Empty values
-- mean these details were not collected; they do not assert a declaration.
ALTER TABLE applications ADD COLUMN contact_phone TEXT NOT NULL DEFAULT ''
  CHECK (length(contact_phone) <= 32);
ALTER TABLE applications ADD COLUMN local_area TEXT NOT NULL DEFAULT ''
  CHECK (length(local_area) <= 120);
ALTER TABLE applications ADD COLUMN electoral_enrolment TEXT NOT NULL DEFAULT ''
  CHECK (electoral_enrolment IN ('', 'enrolled', 'not-enrolled', 'unsure'));
ALTER TABLE applications ADD COLUMN membership_intent TEXT NOT NULL DEFAULT ''
  CHECK (length(membership_intent) <= 600);
