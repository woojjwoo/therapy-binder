// Jest mock for @noble/ciphers/aes (ESM-only)
// Uses Node.js crypto for correct AES-GCM behavior in tests

const nodeCrypto = require('crypto');

function gcm(key, iv) {
  return {
    encrypt(data) {
      const cipher = nodeCrypto.createCipheriv(
        'aes-256-gcm',
        Buffer.from(key),
        Buffer.from(iv)
      );
      const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
      const tag = cipher.getAuthTag();
      // Output: ciphertext + 16-byte auth tag (matches @noble/ciphers format)
      const out = new Uint8Array(encrypted.length + tag.length);
      out.set(new Uint8Array(encrypted));
      out.set(new Uint8Array(tag), encrypted.length);
      return out;
    },
    decrypt(data) {
      const ciphertext = data.slice(0, data.length - 16);
      const tag = data.slice(data.length - 16);
      const decipher = nodeCrypto.createDecipheriv(
        'aes-256-gcm',
        Buffer.from(key),
        Buffer.from(iv)
      );
      decipher.setAuthTag(Buffer.from(tag));
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(ciphertext)),
        decipher.final(),
      ]);
      return new Uint8Array(decrypted);
    },
  };
}

module.exports = { gcm };
