/**
 * SQLite schema definitions.
 * Text data is stored encrypted (AES-256-GCM).
 * Voice/image URIs stored as plaintext — local device only.
 */

export const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS metadata (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id            TEXT PRIMARY KEY,
    ciphertext    TEXT NOT NULL,
    iv            TEXT NOT NULL,
    schema_ver    INTEGER NOT NULL DEFAULT 1,
    mood_score    INTEGER NOT NULL,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS voice_refs (
    id          TEXT PRIMARY KEY,
    session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    local_uri   TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    label       TEXT,
    block_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS image_refs (
    id          TEXT PRIMARY KEY,
    session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    local_uri   TEXT NOT NULL,
    block_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE VIRTUAL TABLE IF NOT EXISTS sessions_fts USING fts5(
    id UNINDEXED,
    content,
    tags,
    insight
  );
`;

export const METADATA_KEYS = {
  SALT: 'kdf_salt',
  SCHEMA_VERSION: 'schema_version',
  TRIAL_START: 'trial_start_at',
} as const;
