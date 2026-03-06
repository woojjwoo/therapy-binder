/**
 * Encrypt/decrypt layer over the raw SQLite CRUD in src/db.
 * Text content is encrypted (AES-256-GCM) before writing.
 * Voice/image local URIs are stored separately in plaintext tables.
 */

import {
  saveSession as dbSaveSession,
  getSession as dbGetSession,
  listSessions as dbListSessions,
  deleteSession as dbDeleteSession,
  deleteAllSessions as dbDeleteAllSessions,
} from '../db';
import type { StoredSession } from '../db';
import { encrypt, decrypt } from '../crypto/aes-gcm';
import type { EncryptedPayload, CryptoKey } from '../crypto/aes-gcm';
import type { SessionEntry, SessionEncryptedPayload } from '../models/session';
import type { Block, VoiceBlock, ImageBlock } from '../models/block';

// Re-export raw DB functions so existing consumers keep working
export type { StoredSession };
export {
  dbListSessions as listSessions,
  dbGetSession as getSession,
  dbDeleteSession as deleteSession,
  dbDeleteAllSessions as deleteAllSessions,
};

// ─── Encrypt a session's text payload ─────────────────────────────────────────

export async function encryptSession(
  session: SessionEntry,
  key: CryptoKey,
): Promise<EncryptedPayload> {
  const encryptableBlocks = session.blocks.map((b) => {
    if (b.type === 'voice' || b.type === 'image') {
      return { ...b, localUri: '[local-ref]' };
    }
    return b;
  });

  const payload: SessionEncryptedPayload = {
    blocks: encryptableBlocks,
    tags: session.tags,
    moodScore: session.moodScore,
  };

  return encrypt(JSON.stringify(payload), key);
}

// ─── Decrypt a stored session row ─────────────────────────────────────────────

export interface DecryptedSession {
  id: string;
  moodScore: number;
  createdAt: string;
  updatedAt: string;
  blocks: Block[];
  tags: string[];
}

export async function decryptSession(
  row: StoredSession,
  key: CryptoKey,
): Promise<DecryptedSession | null> {
  const plaintext = await decrypt(
    { ciphertext: row.ciphertext, iv: row.iv, version: row.schema_ver },
    key,
  );
  if (!plaintext) return null;

  const data = JSON.parse(plaintext) as SessionEncryptedPayload;
  return {
    id: row.id,
    moodScore: row.mood_score,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    blocks: data.blocks ?? [],
    tags: data.tags ?? [],
  };
}

// ─── Encrypt + save in one call ───────────────────────────────────────────────

export async function saveEncryptedSession(
  session: SessionEntry,
  key: CryptoKey,
): Promise<void> {
  const payload = await encryptSession(session, key);

  const voiceBlocks = session.blocks.filter(
    (b): b is VoiceBlock => b.type === 'voice',
  );
  const imageBlocks = session.blocks.filter(
    (b): b is ImageBlock => b.type === 'image',
  );

  await dbSaveSession(
    {
      id: session.id,
      moodScore: session.moodScore,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    },
    payload,
    voiceBlocks,
    imageBlocks,
  );
}

// ─── Load + decrypt in one call ───────────────────────────────────────────────

export async function loadDecryptedSession(
  id: string,
  key: CryptoKey,
): Promise<DecryptedSession | null> {
  const row = await dbGetSession(id);
  if (!row) return null;
  return decryptSession(row, key);
}

// ─── Pre-encrypted save (used by new-session screen) ──────────────────────────

export async function saveSession(
  session: Pick<SessionEntry, 'id' | 'moodScore' | 'createdAt' | 'updatedAt'>,
  payload: EncryptedPayload,
  voiceBlocks: VoiceBlock[],
  imageBlocks: ImageBlock[],
): Promise<void> {
  await dbSaveSession(session, payload, voiceBlocks, imageBlocks);
}
