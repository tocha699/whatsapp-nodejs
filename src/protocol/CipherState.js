const crypto = require('./crypto');

class CipherState {
  constructor(name) {
    this.name = name;
    this.key = Buffer.alloc(0); // aes 加解密的 key 字段
  }

  setKey(key) {
    this.key = key;
    this.setNonce(0);
  }

  setNonce(nonce) {
    this.nonce = nonce;
  }

  hasKey() {
    return this.key && this.key.length;
  }

  rekey() {
    const key = crypto.encryptAES256GCM(
      Buffer.alloc(32).fill(0),
      this.key,
      Buffer.alloc(0),
      2 ** 64 - 1
    );
    this.setKey(key);
  }

  encryptAES256GCM(ad, plaintext) {
    if (!this.key.length) return plaintext;
    const result = crypto.encryptAES256GCM(plaintext, this.key, ad, this.nonce);
    this.nonce++;
    return result;
  }

  decryptAES256GCM(ad, ciphertext) {
    if (!this.key.length) return ciphertext;
    const result = crypto.decryptAES256GCM(ciphertext, this.key, ad, this.nonce);
    this.nonce++;
    return result;
  }
}

module.exports = CipherState;
