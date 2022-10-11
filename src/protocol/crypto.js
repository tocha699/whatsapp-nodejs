const PKCS7 = require('./PKCS7');

module.exports = {
  generateHeader(num, len = 6) {
    let str = Number(num).toString(16);
    str = new Array(len - str.length + 1).join('0') + str;
    return Buffer.from(str, 'hex');
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
};
