CREATE TABLE IF NOT EXISTS miniapp_sessions (
  token TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_miniapp_sessions_expiry ON miniapp_sessions(expires_at);
