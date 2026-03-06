/**
 * Biometric unlock using expo-local-authentication + expo-secure-store.
 *
 * Biometric flow:
 *   - Generate 32 random bytes (the AES-256 key itself)
 *   - Store as hex in SecureStore
 *   - Generate a separate BIP-39 mnemonic as backup recovery phrase
 *   - On unlock: authenticate → retrieve hex → importRawKey()
 *
 * Passphrase flow (create-passphrase screen):
 *   - Derive key from passphrase + salt via PBKDF2
 *   - Store passphrase in SecureStore for biometric re-unlock
 *   - On unlock: authenticate → retrieve passphrase → re-derive key
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as ExpoCrypto from 'expo-crypto';
import { importRawKey, type CryptoKey } from './aes-gcm';
import { deriveKey } from './kdf';
import { generateMnemonic } from './mnemonic';
import { getMeta } from '../db';
import { METADATA_KEYS } from '../db/schema';

const RAW_KEY_HEX_KEY = 'tb_raw_key_hex';
const PASSPHRASE_KEY   = 'tb_passphrase';

// In-memory fallback when SecureStore is unavailable (e.g. Expo Go on device)
const memoryStore = new Map<string, string>();

async function secureSet(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    memoryStore.set(key, value);
  }
}

async function secureGet(key: string): Promise<string | null> {
  try {
    const val = await SecureStore.getItemAsync(key);
    if (val != null) return val;
  } catch {
    // SecureStore unavailable, fall through to memory
  }
  return memoryStore.get(key) ?? null;
}

export type BiometricType = 'faceid' | 'touchid' | 'passcode' | 'none';

// ─── Biometric type detection ─────────────────────────────────────────────────

export async function getBiometricType(): Promise<BiometricType> {
  try {
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) return 'passcode';

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'faceid';
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'touchid';
    return 'passcode';
  } catch {
    return 'passcode';
  }
}

// ─── Biometric flow ───────────────────────────────────────────────────────────

/**
 * Generate a random AES-256 key, store it in SecureStore, and return it ready to use.
 */
export async function generateAndStoreKey(): Promise<{ key: CryptoKey }> {
  const randomBytes = ExpoCrypto.getRandomBytes(32);
  const keyHex = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  await secureSet(RAW_KEY_HEX_KEY, keyHex);
  const key = await importRawKey(randomBytes);
  return { key };
}

/**
 * Retrieve and import the stored key without any biometric prompt.
 * Returns null if no key is stored yet (first launch).
 */
export async function unlockWithStoredKey(): Promise<CryptoKey | null> {
  try {
    const keyHex = await secureGet(RAW_KEY_HEX_KEY);
    if (!keyHex) return null;
    const bytes = new Uint8Array(keyHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
    return importRawKey(bytes);
  } catch {
    return null;
  }
}

/**
 * Unlock the app using biometrics (Face ID / Touch ID / passcode).
 * Retrieves the stored key and imports it as a CryptoKey.
 */
export async function unlockWithBiometrics(prompt: string): Promise<CryptoKey | null> {
  try {
    const authResult = await LocalAuthentication.authenticateAsync({
      promptMessage: prompt,
      fallbackLabel: 'Use Passcode',
      disableDeviceFallback: false,
    });

    if (!authResult.success) return null;

    // Biometric flow: raw key stored as hex
    const keyHex = await secureGet(RAW_KEY_HEX_KEY);
    if (keyHex) {
      const bytes = new Uint8Array(
        keyHex.match(/.{2}/g)!.map((b) => parseInt(b, 16))
      );
      return importRawKey(bytes);
    }

    // Passphrase flow: passphrase stored, re-derive key
    const passphrase = await secureGet(PASSPHRASE_KEY);
    const salt = await getMeta(METADATA_KEYS.SALT);
    if (passphrase && salt) {
      const rawKey = await deriveKey(passphrase, salt);
      return importRawKey(rawKey);
    }

    return null;
  } catch {
    return null;
  }
}

// ─── Passphrase flow ──────────────────────────────────────────────────────────

/**
 * Store passphrase in SecureStore after passphrase-based onboarding.
 * This allows Face ID / passcode re-unlock without re-typing the passphrase.
 */
export async function storePassphraseSecurely(passphrase: string): Promise<void> {
  await secureSet(PASSPHRASE_KEY, passphrase);
}
