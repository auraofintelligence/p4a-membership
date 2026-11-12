-- Existing applications retain their original notice version and an empty answer.
-- An anonymous repeat submission must not rewrite another person's application.
ALTER TABLE applications ADD COLUMN suggested_games TEXT NOT NULL DEFAULT ''
  CHECK (length(suggested_games) <= 400);
