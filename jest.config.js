module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(@scure/bip39|@noble/hashes|@noble/ciphers|@noble)/)',
  ],
  moduleNameMapper: {
    '^expo-crypto$': '<rootDir>/__mocks__/expo-crypto.js',
    '^@noble/ciphers/aes$': '<rootDir>/__mocks__/@noble/ciphers/aes.js',
    '^@noble/hashes/pbkdf2$': '<rootDir>/__mocks__/@noble/hashes/pbkdf2.js',
    '^@noble/hashes/sha2$': '<rootDir>/__mocks__/@noble/hashes/sha2.js',
    '^@scure/bip39$': '<rootDir>/__mocks__/@scure/bip39/index.js',
    '^@scure/bip39/wordlists/english$': '<rootDir>/__mocks__/@scure/bip39/wordlists/english.js',
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    },
  },
};
