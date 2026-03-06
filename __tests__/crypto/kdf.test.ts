import { deriveKey, deriveKeyFromMnemonic, generateSalt } from '../../src/crypto/kdf';
import { importRawKey, encrypt, decrypt, type CryptoKey } from '../../src/crypto/aes-gcm';

describe('Key Derivation (PBKDF2/Argon2id)', () => {
  const passphrase = 'correct horse battery staple';
  let saltHex: string;

  beforeAll(() => {
    saltHex = generateSalt();
  });

  it('produces a 32-byte key', async () => {
    const key = await deriveKey(passphrase, saltHex);
    expect(key.byteLength).toBe(32);
  });

  it('produces the same key for the same passphrase + salt (deterministic)', async () => {
    const key1 = await deriveKey(passphrase, saltHex);
    const key2 = await deriveKey(passphrase, saltHex);
    expect(Buffer.from(key1).toString('hex')).toBe(Buffer.from(key2).toString('hex'));
  });

  it('produces different keys for different passphrases', async () => {
    const key1 = await deriveKey('passphrase-A', saltHex);
    const key2 = await deriveKey('passphrase-B', saltHex);
    expect(Buffer.from(key1).toString('hex')).not.toBe(Buffer.from(key2).toString('hex'));
  });

  it('produces different keys for different salts', async () => {
    const salt2 = generateSalt();
    const key1 = await deriveKey(passphrase, saltHex);
    const key2 = await deriveKey(passphrase, salt2);
    expect(Buffer.from(key1).toString('hex')).not.toBe(Buffer.from(key2).toString('hex'));
  });

  it('recovery key (mnemonic = passphrase) correctly reconstructs the master key', async () => {
    const masterKeyBytes = await deriveKey(passphrase, saltHex);
    const masterKey = await importRawKey(masterKeyBytes);

    const plaintext = 'I need to forgive myself for last year.';
    const payload = await encrypt(plaintext, masterKey);

    // Simulate recovery: derive from mnemonic using same input
    const recoveryKeyBytes = await deriveKeyFromMnemonic(passphrase, saltHex);
    const recoveryKey = await importRawKey(recoveryKeyBytes);

    const recovered = await decrypt(payload, recoveryKey);
    expect(recovered).toBe(plaintext);
  });

  it('wrong passphrase cannot decrypt after recovery', async () => {
    const masterKeyBytes = await deriveKey(passphrase, saltHex);
    const masterKey = await importRawKey(masterKeyBytes);
    const payload = await encrypt('private note', masterKey);

    const wrongKeyBytes = await deriveKey('wrong passphrase', saltHex);
    const wrongKey = await importRawKey(wrongKeyBytes);

    const result = await decrypt(payload, wrongKey);
    expect(result).toBeNull();
  });
});
