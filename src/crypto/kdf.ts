/**
 * Key derivation using @noble/hashes pbkdf2 — pure JS, no crypto.subtle.
 * Works in React Native / Hermes without any polyfill.
 *
 * Iterations: 100,000 for production native builds.
 * In Expo Go (pure JS, no JIT), pbkdf2 is synchronous and blocks the UI thread.
 * Set EXPO_PUBLIC_KDF_ITERATIONS in .env to override for dev/testing.
 */

// @ts-ignore
import { pbkdf2 } from '@noble/hashes/pbkdf2';
// @ts-ignore
import { sha256 } from '@noble/hashes/sha2';
import * as ExpoCrypto from 'expo-crypto';

const KDF_ITERATIONS = Number(process.env.EXPO_PUBLIC_KDF_ITERATIONS) || 100_000;

export const SALT_BYTES = 32;

export function generateSalt(): string {
  const bytes = ExpoCrypto.getRandomBytes(SALT_BYTES);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToUint8Array(hex: string): Uint8Array {
  const result = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    result[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return result;
}

/**
 * Derive a 32-byte master key from a passphrase + hex salt.
 * PBKDF2-SHA256, 100,000 iterations.
 */
export async function deriveKey(
  passphrase: string,
  saltHex: string
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const passphraseBytes = encoder.encode(passphrase);
  const saltBytes = hexToUint8Array(saltHex);

  // Yield to UI thread so the loading spinner renders before we block
  await new Promise((resolve) => setTimeout(resolve, 50));

  return pbkdf2(sha256, passphraseBytes, saltBytes, {
    c: KDF_ITERATIONS,
    dkLen: 32,
  });
}

/**
 * Derive the master key from the BIP-39 recovery mnemonic.
 */
export async function deriveKeyFromMnemonic(
  mnemonic: string,
  saltHex: string
): Promise<Uint8Array> {
  const normalized = mnemonic.trim().toLowerCase().replace(/\s+/g, ' ');
  return deriveKey(normalized, saltHex);
}
