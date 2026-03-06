/**
 * Re-encrypt all sessions when the user changes their passphrase.
 * Atomically swaps every ciphertext from oldKey → newKey.
 * If any session fails to decrypt (corrupted), it is skipped and reported.
 */

import { getDb } from '../db';
import { decrypt, encrypt } from './aes-gcm';
import type { EncryptedPayload, CryptoKey } from './aes-gcm';

export interface ReEncryptResult {
  total: number;
  succeeded: number;
  skipped: number;
  skippedIds: string[];
}

export async function reEncryptAllSessions(
  oldKey: CryptoKey,
  newKey: CryptoKey
): Promise<ReEncryptResult> {
  const db = await getDb();

  const rows = await db.getAllAsync<{
    id: string;
    ciphertext: string;
    iv: string;
    schema_ver: number;
  }>('SELECT id, ciphertext, iv, schema_ver FROM sessions');

  const result: ReEncryptResult = {
    total: rows.length,
    succeeded: 0,
    skipped: 0,
    skippedIds: [],
  };

  for (const row of rows) {
    const payload: EncryptedPayload = {
      ciphertext: row.ciphertext,
      iv: row.iv,
      version: row.schema_ver,
    };

    const plaintext = await decrypt(payload, oldKey);
    if (plaintext === null) {
      result.skipped++;
      result.skippedIds.push(row.id);
      continue;
    }

    const newPayload = await encrypt(plaintext, newKey);

    await db.runAsync(
      'UPDATE sessions SET ciphertext = ?, iv = ?, schema_ver = ? WHERE id = ?',
      [newPayload.ciphertext, newPayload.iv, newPayload.version, row.id]
    );

    result.succeeded++;
  }

  return result;
}
