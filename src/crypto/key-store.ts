import { importRawKey } from './aes-gcm';

let _masterKey: CryptoKey | null = null;

export async function storeKey(rawKeyBytes: Uint8Array): Promise<void> {
  _masterKey = await importRawKey(rawKeyBytes);
}

export function getKey(): CryptoKey | null {
  return _masterKey;
}

export function requireKey(): CryptoKey {
  if (_masterKey === null) {
    throw new Error('App is locked — master key not in memory');
  }
  return _masterKey;
}

export function clearKey(): void {
  _masterKey = null;
}

export function isUnlocked(): boolean {
  return _masterKey !== null;
}
