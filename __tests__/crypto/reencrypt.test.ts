/**
 * Tests for reEncryptAllSessions logic (pure crypto layer, no SQLite).
 * We test the underlying encrypt/decrypt/reEncrypt primitives end-to-end.
 */

import { encrypt, decrypt, reEncrypt, importRawKey, type CryptoKey } from '../../src/crypto/aes-gcm';

function makeKey(): Promise<CryptoKey> {
  const raw = new Uint8Array(32);
  for (let i = 0; i < 32; i++) raw[i] = i + 1;
  return importRawKey(raw);
}

function makeKey2(): Promise<CryptoKey> {
  const raw = new Uint8Array(32);
  for (let i = 0; i < 32; i++) raw[i] = (i + 17) % 256;
  return importRawKey(raw);
}

describe('re-encryption (passphrase change)', () => {
  it('re-encrypts ciphertext from oldKey → newKey correctly', async () => {
    const oldKey = await makeKey();
    const newKey = await makeKey2();

    const plaintext = 'This is sensitive therapy data';
    const original = await encrypt(plaintext, oldKey);

    const reEncrypted = await reEncrypt(original, oldKey, newKey);
    expect(reEncrypted).not.toBeNull();

    // New key can decrypt
    const recovered = await decrypt(reEncrypted!, newKey);
    expect(recovered).toBe(plaintext);
  });

  it('old key cannot decrypt re-encrypted payload', async () => {
    const oldKey = await makeKey();
    const newKey = await makeKey2();

    const original = await encrypt('private content', oldKey);
    const reEncrypted = await reEncrypt(original, oldKey, newKey);

    // Old key should fail
    const result = await decrypt(reEncrypted!, oldKey);
    expect(result).toBeNull();
  });

  it('re-encrypt returns null if oldKey is wrong', async () => {
    const realKey = await makeKey();
    const wrongKey = await makeKey2();
    const newKey = await makeKey2();

    const original = await encrypt('data', realKey);
    const result = await reEncrypt(original, wrongKey, newKey);
    expect(result).toBeNull();
  });

  it('each re-encryption produces a fresh IV (unique ciphertext)', async () => {
    const key = await makeKey();
    const newKey = await makeKey2();

    const original = await encrypt('same data', key);
    const r1 = await reEncrypt(original, key, newKey);
    const r2 = await reEncrypt(original, key, newKey);

    // Same plaintext, different IVs → different ciphertexts
    expect(r1!.iv).not.toBe(r2!.iv);
    expect(r1!.ciphertext).not.toBe(r2!.ciphertext);
  });
});
