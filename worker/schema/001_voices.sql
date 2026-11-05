CREATE TABLE IF NOT EXISTS voices (
  id INTEGER PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('personal', 'public')),
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_voices_owner ON voices(owner_id);
CREATE INDEX IF NOT EXISTS idx_voices_status ON voices(status);
