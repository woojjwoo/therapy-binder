// Jest mock for @scure/bip39 (ESM-only package)
const WORDS = ['abandon','ability','able','about','above','absent','absorb','abstract',
  'absurd','abuse','access','accident','account','accuse','achieve','acid','acoustic',
  'acquire','across','act','action','actor','actress','actual'];

function generateMnemonic(wordlist, strength) {
  const count = strength === 256 ? 24 : 12;
  return Array.from({ length: count }, (_, i) => WORDS[i % WORDS.length]).join(' ');
}

function entropyToMnemonic(entropy, wordlist) {
  // Deterministic mock: just return 24 words from the WORDS array
  return Array.from({ length: 24 }, (_, i) => WORDS[i % WORDS.length]).join(' ');
}

function validateMnemonic(mnemonic, wordlist) {
  const words = mnemonic.trim().split(' ');
  return words.length === 24 || words.length === 12;
}

module.exports = { generateMnemonic, entropyToMnemonic, validateMnemonic };
