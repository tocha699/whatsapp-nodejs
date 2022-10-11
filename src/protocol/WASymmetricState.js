const crypto = require('crypto');
const CipherState = require('./CipherState');

class WASymmetricState {
  constructor(cipherstate) {
    this._cipherstate = cipherstate;
    // Noise_XX_25519_AESGCM_SHA256 + 0x00 0x00 0x00 0x00
    // aes 加解密的 aad 字段
    // 可生成 aes 加解密的 key 字段
    // let _ck = Buffer.from('Tm9pc2VfWFhfMjU1MTlfQUVTR0NNX1NIQTI1NgAAAAA=', 'base64')
    this._ck = Buffer.alloc(0);
    this._h = Buffer.alloc(0);

    this.hashname = 'SHA256';
  }

  set _ck(val) {
    this.__ck = val;
    // console.log('set ck', val, val.toString());
  }

  get _ck() {
    return this.__ck;
  }

  set _h(val) {
    this.__h = val;
    // console.log('set -h', val, val.toString());
  }

  get _h() {
    return this.__h;
  }

  get ciphername() {
    return this._cipherstate.cipher.name;
  }

  cipherstate_has_key() {
    return this._cipherstate.has_key();
  }

  // Noise_XX_25519_AESGCM_SHA256
  initialize_symmetric(protocolname) {
    const lendiff = protocolname.length - 32;
    // console.log('lendiff', lendiff);
    if (lendiff <= 0) {
      this._h = Buffer.concat([Buffer.from(protocolname), Buffer.alloc(Math.abs(lendiff)).fill(0)]);
    } else {
      this._h = crypto.hash(protocolname, 'sha256', '');
    }
    this._ck = this._h;
  }

  toBuffer(plaintext) {
    if (typeof plaintext === 'undefined') return Buffer.alloc(0);
    return typeof plaintext === 'string'
      ? Buffer.from(plaintext, 'base64')
      : Buffer.from(plaintext);
  }

  mix_key(input_key_material) {
    const output = crypto.hkdf(this._ck, this.toBuffer(input_key_material), 2);
    // console.log('mix_key', input_key_material, this._ck, Buffer.from(output[0], 'base64'));
    this._ck = Buffer.from(output[0], 'base64');
    const temp_k = Buffer.from(output[1], 'base64');

    this._cipherstate.initialize_key(temp_k);
  }

  mix_hash(data) {
    this._h = crypto.hash(Buffer.concat([this._h, this.toBuffer(data)]), 'sha256', '');
  }

  mix_key_and_hash(input_key_material) {
    const output = crypto.hkdf(this._ck, input_key_material, 3);
    this._ck = Buffer.from(output[0], 'base64');
    const temp_h = Buffer.from(output[1], 'base64');
    const temp_k = Buffer.from(output[1], 'base64');
    this.mix_hash(temp_h);
    this._cipherstate.initialize_key(temp_k);
  }

  get_handshake_hash() {
    return this._h;
  }

  // encrypt_and_hash(plaintext) {
  //   const ciphertext = this._cipherstate.encrypt_with_ad(this._h, this.toBuffer(plaintext));
  //   this.mix_hash(ciphertext);
  //   return ciphertext;
  // }

  decrypt_and_hash(ciphertext) {
    const plaintext = this._cipherstate.decrypt_with_ad(this._h, this.toBuffer(ciphertext));
    this.mix_hash(ciphertext);
    return plaintext;
  }

  split() {
    const output = crypto.hkdf(this._ck, Buffer.alloc(0), 2);
    const temp_k1 = Buffer.from(output[0], 'base64');
    const temp_k2 = Buffer.from(output[1], 'base64');

    const c1 = new CipherState(this._cipherstate.cipher, 'send');
    const c2 = new CipherState(this._cipherstate.cipher, 'recv');
    c1.initialize_key(temp_k1);
    c2.initialize_key(temp_k2);
    return [c1, c2];
  }

  encrypt_and_hash(plaintext) {
    const ciphertext = this._cipherstate.encrypt_with_ad(this._h, this.toBuffer(plaintext));
    if (this._cipherstate.has_key()) this.mix_hash(ciphertext);
    return ciphertext;
  }
}

module.exports = WASymmetricState;
