const crypto = require('crypto');
// const curve = require('curve25519-n');
const { x25519 } = require('@noble/curves/ed25519');
const PKCS7 = require('./pkcs7/PKCS7');

module.exports = {
  randomBytes(len) {
    return crypto.randomBytes(len);
  },

  toBuffer(plaintext) {
    return typeof plaintext === 'string'
      ? Buffer.from(plaintext, 'base64')
      : Buffer.from(plaintext);
  },

  generateHeader(num, len = 6) {
    let str = Number(num).toString(16);
    str = new Array(len - str.length + 1).join('0') + str;
    return Buffer.from(str, 'hex');
  },

  dh(keyPair, key) {
    // const privateKey = curve.makeSecretKey(this.toBuffer(keyPair.private));
    // const aeskey = curve.deriveSharedSecret(privateKey, this.toBuffer(key)).toString('base64');

    const privateKey = this.toBuffer(keyPair.private);
    // const aeskey = curve.deriveSharedSecret(privateKey, this.toBuffer(key)).toString('base64');
    const aeskey = x25519.getSharedSecret(privateKey, this.toBuffer(key)).toString('base64');
    return Buffer.from(aeskey, 'base64');
  },

  hash(message, type = 'md5', encode = 'base64') {
    return crypto
      .createHash(type)
      .update(message)
      .digest(encode);
  },

  hmacHash(key, message, type = 'sha256', encode = 'base64') {
    const hmac = crypto.createHmac(type, this.toBuffer(key));
    hmac.update(this.toBuffer(message));
    return hmac.digest(encode);
  },

  hkdf(chaining_key, input_key_material, num_outputs = 2) {
    const temp_key = this.hmacHash(chaining_key, input_key_material);
    const output1 = this.hmacHash(temp_key, Buffer.from([0x01]));
    const output2 = this.hmacHash(
      temp_key,
      Buffer.concat([this.toBuffer(output1), Buffer.from([0x02])])
    );
    if (num_outputs === 2) {
      return [output1, output2];
    }
    const output3 = this.hmacHash(
      temp_key,
      Buffer.concat([this.toBuffer(output2), Buffer.from([0x03])])
    );
    return [output1, output2, output3];
  },

  encryptAES256GCM(params, key, aad, iiv = 0, encode = '') {
    const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'base64') : key;
    const iv = typeof iiv === 'object' ? iiv : this.generateHeader(iiv, 24);
    const paramsBuffer = typeof params === 'string' ? Buffer.from(params, 'base64') : params;
    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
    if (aad) cipher.setAAD(typeof aad === 'string' ? Buffer.from(aad, 'base64') : aad);
    const outputs = [];
    outputs.push(cipher.update(paramsBuffer));
    outputs.push(cipher.final());
    outputs.push(cipher.getAuthTag());
    if (encode) return Buffer.concat(outputs).toString(encode);
    return Buffer.concat(outputs);
  },

  decryptAES256GCM(params, key, aad, iiv = 0, encode = '') {
    const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'base64') : key;
    const iv = typeof iiv === 'object' ? iiv : this.generateHeader(iiv, 24);
    const paramsBuffer = typeof params === 'string' ? Buffer.from(params, 'base64') : params;
    const authTag = paramsBuffer.slice(-16);
    const dataBuffer = paramsBuffer.slice(0, -16);
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
    decipher.setAuthTag(authTag);
    if (aad) decipher.setAAD(typeof aad === 'string' ? Buffer.from(aad, 'base64') : aad);
    const outputs = [];
    outputs.push(decipher.update(dataBuffer));
    outputs.push(decipher.final());

    if (encode) return Buffer.concat(outputs).toString(encode);
    return Buffer.concat(outputs);
  },

  encryptAES256CBC(key, iiv = 0, params, encode = '') {
    const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'base64') : key;
    const iv = typeof iiv === 'object' ? iiv : this.generateHeader(iiv, 24);
    let paramsBuffer = typeof params === 'string' ? Buffer.from(params, 'base64') : params;
    if (paramsBuffer.length % 16 !== 0) {
      const padder = new PKCS7(128).padder();
      paramsBuffer = Buffer.concat([padder.update(paramsBuffer), padder.finalize()]);
    }
    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
    cipher.setAutoPadding(false);
    const outputs = [];
    outputs.push(cipher.update(paramsBuffer));
    outputs.push(cipher.final());
    if (encode) return Buffer.concat(outputs).toString(encode);
    const encrypted = Buffer.concat(outputs);
    return encrypted;
  },

  decryptAES256CBC(key, iiv = 0, params, encode = '') {
    const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'base64') : key;
    const iv = typeof iiv === 'object' ? iiv : this.generateHeader(iiv, 24);
    const paramsBuffer = typeof params === 'string' ? Buffer.from(params, 'base64') : params;
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
    decipher.setAutoPadding(false);
    const outputs = [];
    outputs.push(decipher.update(paramsBuffer));
    outputs.push(decipher.final());
    if (encode) return Buffer.concat(outputs).toString(encode);
    const decrypted = Buffer.concat(outputs);
    const unpadder = new PKCS7(128).unpadder();
    return Buffer.concat([unpadder.update(decrypted), unpadder.finalize()]);
  },
};
