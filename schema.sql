-- Sky Hearts — Neon Database Schema
-- Run this in Neon SQL Editor (console.neon.tech → your project → SQL Editor)

CREATE TABLE IF NOT EXISTS clients (
  id          TEXT PRIMARY KEY,
  nick        TEXT NOT NULL,
  note        TEXT DEFAULT '',
  deadline    TEXT DEFAULT '',
  guarantor   TEXT DEFAULT 'нет',
  code_phrase TEXT DEFAULT '',
  ordered     INTEGER DEFAULT 0,
  added_ts    BIGINT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS heart_history (
  id          TEXT PRIMARY KEY,
  client_id   TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date        TEXT NOT NULL,
  amount      INTEGER NOT NULL,
  note        TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_heart_history_client_id ON heart_history(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_added_ts ON clients(added_ts DESC);
