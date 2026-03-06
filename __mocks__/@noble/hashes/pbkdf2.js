// Jest mock for @noble/hashes/pbkdf2 — uses Node.js crypto for correct behavior

const nodeCrypto = require('crypto');

function pbkdf2(hash, password, salt, opts) {
  const result = nodeCrypto.pbkdf2Sync(
    Buffer.from(password),
    Buffer.from(salt),
    opts.c,
    opts.dkLen,
    'sha256'
  );
  return new Uint8Array(result);
}

module.exports = { pbkdf2 };
