const { randomBytes } = require('crypto');
module.exports = {
  getRandomBytes: (size) => new Uint8Array(randomBytes(size)),
  getRandomBytesAsync: async (size) => new Uint8Array(randomBytes(size)),
};
