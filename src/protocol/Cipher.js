const crypto = require('./crypto');

class Cipher {
  constructor(name = '') {
    this._name = name;
  }

  get name() {
    return this._name;
  }

  encrypt(plaintext, key, ad, nonce, encode = '') {
    return crypto.encryptAES256GCM(plaintext, key, ad, nonce, encode);
  }

  decrypt(ciphertext, key, ad, nonce, encode = '') {
    return crypto.decryptAES256GCM(ciphertext, key, ad, nonce, encode);
  }

  rekey(key) {
    return this.encrypt(Buffer.alloc(32).fill(0), key, Buffer.alloc(0), 2 ** 64 - 1);
  }
}

module.exports = Cipher;
