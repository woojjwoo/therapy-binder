import { importRawKey, encrypt, decrypt, reEncrypt, type CryptoKey } from '../../src/crypto/aes-gcm';

const TEST_KEY_BYTES = new Uint8Array(32).fill(0xab);
const TEST_KEY_BYTES_WRONG = new Uint8Array(32).fill(0xcd);

describe('AES-256-GCM', () => {
  let correctKey: CryptoKey;
  let wrongKey: CryptoKey;

  beforeAll(async () => {
    correctKey = await importRawKey(TEST_KEY_BYTES);
    wrongKey = await importRawKey(TEST_KEY_BYTES_WRONG);
  });

  it('decrypts ciphertext correctly with the right key', async () => {
    const plaintext = "I felt unheard in today's session.";
    const payload = await encrypt(plaintext, correctKey);

    expect(payload.ciphertext).not.toContain(plaintext);
    expect(payload.iv).toBeDefined();
    expect(payload.version).toBe(1);

    const decrypted = await decrypt(payload, correctKey);
    expect(decrypted).toBe(plaintext);
  });

  it('returns null when decrypting with the wrong key', async () => {
    const payload = await encrypt('sensitive insight', correctKey);
    const result = await decrypt(payload, wrongKey);
    expect(result).toBeNull();
  });

  it('produces new ciphertext after re-encryption; old key can no longer decrypt', async () => {
    const plaintext = 'progress noted this week';
    const original = await encrypt(plaintext, correctKey);
    const reEncrypted = await reEncrypt(original, correctKey, wrongKey);

    expect(reEncrypted).not.toBeNull();
    expect(reEncrypted!.ciphertext).not.toBe(original.ciphertext);

    // Old key fails on new ciphertext — no plaintext residue
    const oldDecrypt = await decrypt(reEncrypted!, correctKey);
    expect(oldDecrypt).toBeNull();

    // New key succeeds
    const newDecrypt = await decrypt(reEncrypted!, wrongKey);
    expect(newDecrypt).toBe(plaintext);
  });

  it('returns null when re-encrypting with the wrong old key', async () => {
    const payload = await encrypt('something', correctKey);
    const result = await reEncrypt(payload, wrongKey, correctKey);
    expect(result).toBeNull();
  });

  it('each encryption produces a unique IV and ciphertext', async () => {
    const a = await encrypt('same text', correctKey);
    const b = await encrypt('same text', correctKey);
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it('rejects a key shorter than 32 bytes', async () => {
    await expect(importRawKey(new Uint8Array(16))).rejects.toThrow();
  });
});
