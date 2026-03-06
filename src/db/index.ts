import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES } from './schema';
import type { EncryptedPayload } from '../crypto/aes-gcm';
import type { VoiceBlock, ImageBlock } from '../models/block';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('therapy_binder.db');
  await _db.execAsync(CREATE_TABLES);
  return _db;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function getMeta(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM metadata WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
    [key, value]
  );
}

export const upsertMeta = setMeta;

// ─── Session row type ─────────────────────────────────────────────────────────

export interface StoredSession {
  id: string;
  ciphertext: string;
  iv: string;
  schema_ver: number;
  mood_score: number;
  created_at: string;
  updated_at: string;
}

// ─── Save ─────────────────────────────────────────────────────────────────────

export async function saveSession(
  session: { id: string; moodScore: number; createdAt: string; updatedAt: string },
  payload: EncryptedPayload,
  voiceBlocks: VoiceBlock[],
  imageBlocks: ImageBlock[],
): Promise<void> {
  const db = await getDb();

  await db.runAsync(
    `INSERT OR REPLACE INTO sessions
       (id, ciphertext, iv, schema_ver, mood_score, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      session.id,
      payload.ciphertext,
      payload.iv,
      payload.version,
      session.moodScore,
      session.createdAt,
      session.updatedAt,
    ]
  );

  for (const v of voiceBlocks) {
    await db.runAsync(
      `INSERT OR REPLACE INTO voice_refs (id, session_id, local_uri, duration_ms, label, block_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [v.id, session.id, v.localUri, v.durationMs, v.label ?? null, v.order]
    );
  }

  for (const img of imageBlocks) {
    await db.runAsync(
      `INSERT OR REPLACE INTO image_refs (id, session_id, local_uri, block_order)
       VALUES (?, ?, ?, ?)`,
      [img.id, session.id, img.localUri, img.order]
    );
  }
}

// ─── Get single ───────────────────────────────────────────────────────────────

export async function getSession(id: string): Promise<StoredSession | null> {
  const db = await getDb();
  return db.getFirstAsync<StoredSession>(
    'SELECT * FROM sessions WHERE id = ?',
    [id]
  );
}

// ─── List (newest first) ─────────────────────────────────────────────────────

export async function listSessions(): Promise<StoredSession[]> {
  const db = await getDb();
  return db.getAllAsync<StoredSession>(
    'SELECT * FROM sessions ORDER BY created_at DESC'
  );
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteSession(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sessions WHERE id = ?', [id]);
}

export async function deleteAllSessions(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sessions');
  await db.runAsync('DELETE FROM voice_refs');
  await db.runAsync('DELETE FROM image_refs');
}
