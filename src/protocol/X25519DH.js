const curve = require('curve25519-n');
const DH = require('./DH');

class X25519DH {
  constructor() {
    this._name = '25519';
    this._dhlen = 32;
  }

  get name() {
    return this._name;
  }

  get dhlen() {
    return this._dhlen;
  }

  toBuffer(plaintext) {
    if (typeof plaintext === 'undefined') return Buffer.alloc(0);
    return typeof plaintext === 'string'
      ? Buffer.from(plaintext, 'base64')
      : Buffer.from(plaintext);
  }

  dh(keyPair, key) {
    const privateKey = curve.makeSecretKey(this.toBuffer(keyPair.private));
    const aeskey = curve.deriveSharedSecret(privateKey, this.toBuffer(key)).toString('base64');
    return Buffer.from(aeskey, 'base64');
  }
}

module.exports = X25519DH;
