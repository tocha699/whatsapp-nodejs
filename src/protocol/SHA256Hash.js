const crypto = require('crypto');

class SHA256Hash {
  constructor() {
    this._name = 'SHA256';
    this._hashlen = 32;
    this._blocklen = 64;
  }

  hash(message) {
    return crypto
      .createHash('sha256')
      .update(message)
      .digest();
  }

  get name() {
    return this._name;
  }

  get hashlen() {
    return this._hashlen;
  }

  get blocklen() {
    return this._blocklen;
  }

  hmac_hash(key, message, type = 'sha256', encode = 'base64') {
    const hmac = crypto.createHmac(type, this.toBuffer(key));
    hmac.update(this.toBuffer(message));
    return hmac.digest(encode);
  }

  toBuffer(plaintext) {
    return typeof plaintext === 'string'
      ? Buffer.from(plaintext, 'base64')
      : Buffer.from(plaintext);
  }

  hkdf(chaining_key, input_key_material, num_outputs = 2) {
    const temp_key = this.hmac_hash(chaining_key, input_key_material);
    const output1 = this.hmac_hash(temp_key, Buffer.from([0x01]));
    const output2 = this.hmac_hash(
      temp_key,
      Buffer.concat([this.toBuffer(output1), Buffer.from([0x02])])
    );
    if (num_outputs === 2) {
      return [output1, output2];
    }
    const output3 = this.hmac_hash(
      temp_key,
      Buffer.concat([this.toBuffer(output2), Buffer.from([0x03])])
    );
    return [output1, output2, output3];
  }
}
module.exports = SHA256Hash;
