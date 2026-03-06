/**
 * AES-256-GCM encrypt/decrypt using @noble/ciphers — pure JS, no crypto.subtle.
 * Works in React Native / Hermes without polyfills.
 */

// @ts-ignore
import { gcm } from '@noble/ciphers/aes';
import * as ExpoCrypto from 'expo-crypto';

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  version: number;
}

const SCHEMA_VERSION = 1;
const IV_BYTES = 12;

// ── Base64 helpers (no Buffer dependency) ────────────────────────────────────

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ── Key wrapper ───────────────────────────────────────────────────────────────

// We use a plain Uint8Array as the "CryptoKey" since @noble/ciphers takes raw bytes
export type CryptoKey = Uint8Array;

export async function importRawKey(rawKey: Uint8Array): Promise<CryptoKey> {
  if (rawKey.length !== 32) {
    throw new Error('Master key must be exactly 32 bytes (AES-256)');
  }
  // Return a copy so the original can be cleared
  return new Uint8Array(rawKey);
}

// ── Encrypt ──────────────────────────────────────────────────────────────────

export async function encrypt(
  plaintext: string,
  key: CryptoKey
): Promise<EncryptedPayload> {
  const iv = ExpoCrypto.getRandomBytes(IV_BYTES);
  const encoded = new TextEncoder().encode(plaintext);

  const cipher = gcm(key, iv);
  const ciphertext = cipher.encrypt(encoded);

  return {
    ciphertext: uint8ToBase64(ciphertext),
    iv: uint8ToBase64(iv),
    version: SCHEMA_VERSION,
  };
}

// ── Decrypt ──────────────────────────────────────────────────────────────────

export async function decrypt(
  payload: EncryptedPayload,
  key: CryptoKey
): Promise<string | null> {
  try {
    const ciphertext = base64ToUint8(payload.ciphertext);
    const iv = base64ToUint8(payload.iv);

    const cipher = gcm(key, iv);
    const plaintext = cipher.decrypt(ciphertext);

    return new TextDecoder().decode(plaintext);
  } catch {
    return null;
  }
}

// ── Re-encrypt ───────────────────────────────────────────────────────────────

export async function reEncrypt(
  payload: EncryptedPayload,
  oldKey: CryptoKey,
  newKey: CryptoKey
): Promise<EncryptedPayload | null> {
  const plaintext = await decrypt(payload, oldKey);
  if (plaintext === null) return null;
  return encrypt(plaintext, newKey);
}
