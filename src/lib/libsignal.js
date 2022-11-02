const crypto = require('crypto');

global.window = {};
class XMLHttpRequest {}
global.XMLHttpRequest = XMLHttpRequest;
const libsignal = require('@privacyresearch/libsignal-protocol-typescript');

crypto.getRandomValues = array => {
  const size = array.length;
  return crypto.randomBytes(size);
};
// libsignal.setWebCrypto(crypto)

module.exports = libsignal;
