/**
 * BIP-39 mnemonic generation.
 * Uses expo-crypto for entropy (no crypto.getRandomValues needed in Hermes).
 * Uses @scure/bip39 for wordlist encoding — pure JS, no Buffer.
 */

// @ts-ignore — @scure/bip39 wordlists path not in main types
import { wordlist } from '@scure/bip39/wordlists/english';
import { entropyToMnemonic, validateMnemonic as scureValidate } from '@scure/bip39';
import * as ExpoCrypto from 'expo-crypto';

export const WORD_COUNT = 24;

export function generateMnemonic(): string {
  // Use expo-crypto for secure random bytes — works in Hermes without polyfill
  const entropy = ExpoCrypto.getRandomBytes(32); // 256 bits → 24 words
  return entropyToMnemonic(entropy, wordlist);
}

export function mnemonicToWords(mnemonic: string): string[] {
  return mnemonic.trim().split(' ');
}

export function wordsToMnemonic(words: string[]): string {
  return words.join(' ');
}

export function validateMnemonic(mnemonic: string): boolean {
  const normalized = mnemonic.trim().toLowerCase().replace(/\s+/g, ' ');
  return scureValidate(normalized, wordlist);
}

export function pickChallengeIndices(wordCount = WORD_COUNT): number[] {
  const indices = new Set<number>();
  while (indices.size < 3) {
    const idx = Math.floor(Math.random() * wordCount);
    if (idx > 0 && idx < wordCount - 1) {
      indices.add(idx);
    }
  }
  return Array.from(indices).sort((a, b) => a - b);
}

export function verifyChallengeAnswers(
  mnemonic: string,
  challengeIndices: number[],
  selectedWords: string[]
): boolean {
  const words = mnemonicToWords(mnemonic);
  return challengeIndices.every(
    (idx, position) => words[idx] === selectedWords[position]
  );
}
