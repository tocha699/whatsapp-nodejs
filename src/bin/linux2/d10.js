const libsignal = require("../../lib/libsignal");
const Store = require("../../protocol/signal/Store");
const {
  KeyHelper,
  SignedPublicPreKeyType,
  SignalProtocolAddress,
  SessionBuilder,
  PreKeyType,
  WhisperMessage,
  SessionCipher,
  MessageType
} = libsignal;
class Signal {
  COUNT_GEN_PREKEYS = 100;
  THRESHOLD_REGEN = 10;
  MAX_SIGNED_PREKEY_ID = 16777215;
  constructor(_0x4536fd) {
    this.mobile = _0x4536fd;
    this.store = new Store(_0x4536fd);
  }
  async init() {
    console.debug("init\\x20Signal");
    const _0x101b5c = await this.store.getLocalData();
    if (!_0x101b5c) {
      const _0x5769fc = await KeyHelper.generateIdentityKeyPair();
      const _0x279082 = await KeyHelper.generateRegistrationId(true);
      await this.store.storeLocalData(_0x279082, _0x5769fc);
      this.identityKeyPair = _0x5769fc;
      this.registrationId = _0x279082;
    } else {
      this.identityKeyPair = _0x101b5c.identityKeyPair;
      this.registrationId = _0x101b5c.registrationId;
    }
    this.preKeys = await this.store.loadPreKeys();
    this.signedPrekey = await this.loadLatestSignedPrekey(true);
    this.group_ciphers = {};
    this.session_ciphers = {};
    console.debug("init\\x20Signal\\x20success");
  }
  getRandom(_0x1f8c77) {
    return Math.floor(Math.random() * _0x1f8c77);
  }
  async storeMessage(_0x3a9e02, _0x2dad53, _0x35d018, _0x2a9909) {
    await this.store.storeMessage(_0x3a9e02, _0x2dad53, _0x35d018, _0x2a9909);
  }
  async loadMessage(_0xf7c2ab, _0x597fef) {
    return await this.store.loadMessage(_0xf7c2ab, _0x597fef);
  }
  async removeGroupSession(_0x1c9726) {
    const _0x327eea = _0x1c9726 + "::" + this.mobile + "::0.1";
    await this.store.removeSession(_0x327eea);
  }
  async createGroupSession(_0x3768a9) {
    const _0x275a1e = _0x3768a9 + "::" + this.mobile + "::0.1";
    const _0x474e79 = await this.store.containsSession(_0x275a1e);
    if (!_0x474e79) {
      const _0x3fa360 = await KeyHelper.generateIdentityKeyPair();
      const _0x5ca5b2 = await KeyHelper.generatePreKey(0);
      const _0x3a0e37 = await KeyHelper.generateSignedPreKey(_0x3fa360, 0);
      const _0x3a5534 = await KeyHelper.generateRegistrationId(true);
      const _0x4789c8 = {
        encodedNumber: _0x275a1e,
        identityKey: Buffer.from(_0x3fa360.pubKey),
        registrationId: Number("0x" + Buffer.from(String(_0x3a5534)).toString("hex")),
        preKey: {
          keyId: Number("0x" + Buffer.from(String(_0x5ca5b2.keyId)).toString("hex")),
          publicKey: Buffer.from(_0x5ca5b2.keyPair.pubKey)
        },
        signedPreKey: {
          keyId: Number("0x" + Buffer.from(String(_0x3a0e37.keyId)).toString("hex")),
          publicKey: Buffer.from(_0x3a0e37.keyPair.pubKey),
          signature: Buffer.from(_0x3a0e37.signature)
        }
      };
      await this.create_session(_0x275a1e, _0x4789c8);
    }
  }
  async level_prekeys(_0x3c92d1 = false) {
    console.debug("level_prekeys(force=" + _0x3c92d1 + ")");
    const _0x52d58d = (await this.store.loadPreKeys()).length;
    if (_0x3c92d1 || _0x52d58d < this.THRESHOLD_REGEN) {
      const _0x54dff9 = this.COUNT_GEN_PREKEYS;
      console.debug("Generating\\x20" + _0x54dff9 + "\\x20prekeys");
      const _0x40e6e0 = [];
      let _0x259ccd = this.getRandom(2147483648);
      _0x259ccd -= 1;
      if (_0x52d58d) {
        _0x259ccd = await this.store.loadMaxPreKeyId();
      }
      for (let _0x6ec344 = 0; _0x6ec344 < _0x54dff9; _0x6ec344++) {
        const _0x51a473 = (_0x259ccd + _0x6ec344) % 16777214 + 1;
        const _0x4e9170 = await KeyHelper.generatePreKey(_0x51a473);
        _0x40e6e0.push({
          preKey: _0x4e9170,
          keyId: _0x4e9170.keyId
        });
      }
      await this.store.storePreKeys(_0x40e6e0);
      this.preKeys = await this.store.loadPreKeys();
      return _0x40e6e0;
    }
    return [];
  }
  async load_unsent_prekeys() {
    const _0x241466 = await this.store.loadUnsentPendingPreKeys();
    if (_0x241466.length) {
      console.debug("loaded\\x20" + _0x241466.length + "\\x20unsent\\x20prekeys");
    }
    return _0x241466;
  }
  async set_prekeys_as_sent(_0x45bc94) {
    await this.store.setAsSents(_0x45bc94);
  }
  async generateSignedPrekey() {
    const _0x332b77 = await this.loadLatestSignedPrekey(false);
    let _0x31ab2e = 0;
    if (_0x332b77) {
      if (_0x332b77.keyId >= this.MAX_SIGNED_PREKEY_ID) {
        _0x31ab2e = this.MAX_SIGNED_PREKEY_ID / 2 + 1;
      } else {
        _0x31ab2e = _0x332b77.getId() + 1;
      }
    }
    const _0x3f63ed = await KeyHelper.generateSignedPreKey(this.identityKeyPair, _0x31ab2e);
    await this.store.storeSignedPreKey(_0x3f63ed.keyId, _0x3f63ed);
    return _0x3f63ed;
  }
  async loadLatestSignedPrekey(_0x21ccd7 = false) {
    let _0x2d32f4 = await this.store.loadLatestSignedPrekey();
    if (!_0x2d32f4 && _0x21ccd7) {
      _0x2d32f4 = await this.generateSignedPrekey();
    }
    return _0x2d32f4;
  }
  async get_session_cipher(_0x2224bf) {
    let _0x2f6b6b = null;
    if (this.session_ciphers[_0x2224bf]) {
      _0x2f6b6b = this.session_ciphers[_0x2224bf];
    } else {
      const _0x432726 = new SignalProtocolAddress(_0x2224bf, 1);
      _0x2f6b6b = new SessionCipher(this.store, _0x432726);
      this.session_ciphers[_0x2224bf] = _0x2f6b6b;
    }
    return _0x2f6b6b;
  }
  async create_session(_0x477c0a, _0x276be6, _0x1dce02 = false) {
    const _0x2327f6 = new SessionBuilder(this.store, _0x477c0a);
    try {
      await _0x2327f6.processPreKey(_0x276be6);
    } catch (_0x1cbf51) {
      console.error("create_session\\x20error", _0x477c0a, _0x1cbf51);
      if (_0x1dce02) {
        this.trust_identity(_0x1cbf51.getName(), _0x1cbf51.getIdentityKey());
      }
    }
  }
  generate_random_padding() {
    const _0x26830a = Math.floor(Math.random() * 255) + 1;
    return Buffer.alloc(_0x26830a).fill(_0x26830a);
  }
  unpad(_0xe111ee) {
    let _0x5e14d4 = 0;
    if (typeof _0xe111ee[_0xe111ee.length - 1] === "number") {
      _0x5e14d4 = _0xe111ee[_0xe111ee.length - 1];
    } else {
      _0x5e14d4 = String.fromCharCode(_0xe111ee[_0xe111ee.length - 1]);
    }
    const _0x4f687a = _0x5e14d4 & 255;
    return _0xe111ee.slice(0, _0xe111ee.length - _0x4f687a);
  }
  binaryStringToArrayBuffer(_0x159f8d) {
    let _0x423fe1 = 0;
    const _0x19ef34 = _0x159f8d.length;
    let _0x2a972e;
    const _0x1d374d = [];
    while (_0x423fe1 < _0x19ef34) {
      _0x2a972e = _0x159f8d.charCodeAt(_0x423fe1);
      if (_0x2a972e > 255) {
        throw RangeError("illegal char code: " + _0x2a972e);
      }
      _0x1d374d[_0x423fe1++] = _0x2a972e;
    }
    return Uint8Array.from(_0x1d374d).buffer;
  }
  async encrypt(_0x8c2fd7, _0x291210) {
    const _0x35ea3f = await this.get_session_cipher(_0x8c2fd7);
    const _0x1dc519 = Buffer.concat([Buffer.from(_0x291210), this.generate_random_padding()]);
    const _0x1a13ef = new ArrayBuffer(_0x1dc519.length);
    const _0x31b16f = new Uint8Array(_0x1a13ef);
    _0x1dc519.forEach((_0x5fc907, _0xe88678) => {
      _0x31b16f[_0xe88678] = _0x5fc907;
    });
    const _0x19402d = await _0x35ea3f.encrypt(_0x1a13ef);
    _0x19402d.body = Buffer.from(this.binaryStringToArrayBuffer(_0x19402d.body));
    return _0x19402d;
  }
  async decrypt_pkmsg(_0x2bf1af, _0x54df00, _0x4e7266) {
    _0x54df00 = Buffer.from(_0x54df00);
    const _0x1ea688 = await this.get_session_cipher(_0x2bf1af);
    const _0x5399fe = new ArrayBuffer(_0x54df00.length);
    const _0x100ab5 = new Uint8Array(_0x5399fe);
    for (let _0xcb1a89 = 0; _0xcb1a89 < _0x54df00.length; _0xcb1a89++) {
      const _0x390a8b = _0x54df00[_0xcb1a89];
      _0x100ab5[_0xcb1a89] = _0x390a8b;
    }
    const _0x2cfed9 = Buffer.from(await _0x1ea688.decryptPreKeyWhisperMessage(_0x5399fe));
    if (_0x4e7266) {
      return this.unpad(_0x2cfed9);
    }
    return _0x2cfed9;
  }
  async decrypt_msg(_0x2db931, _0x6c54b4, _0x508218) {
    _0x6c54b4 = Buffer.from(_0x6c54b4);
    const _0x348f38 = await this.get_session_cipher(_0x2db931);
    const _0x2438e0 = new ArrayBuffer(_0x6c54b4.length);
    const _0x1e8d30 = new Uint8Array(_0x2438e0);
    for (let _0x1e3d66 = 0; _0x1e3d66 < _0x6c54b4.length; _0x1e3d66++) {
      const _0x330743 = _0x6c54b4[_0x1e3d66];
      _0x1e8d30[_0x1e3d66] = _0x330743;
    }
    const _0x53d1ac = Buffer.from(await _0x348f38.decryptWhisperMessage(_0x2438e0));
    if (_0x508218) {
      return this.unpad(_0x53d1ac);
    }
    return _0x53d1ac;
  }
  async group_encrypt(_0x4fd44d, _0x321958) {
    const _0x40d0ff = this.get_group_cipher(_0x4fd44d, this.mobile);
    return await _0x40d0ff.encrypt(Buffer.concat([Buffer.from(_0x321958), this.generate_random_padding()]));
  }
  async group_decrypt(_0x3cb0ac, _0x49f49e, _0x73197a) {
    const _0x388994 = this.get_group_cipher(_0x3cb0ac, _0x49f49e);
    let _0x2f27a6 = await _0x388994.decrypt(_0x73197a);
    _0x2f27a6 = this.unpad(_0x2f27a6);
    return _0x2f27a6;
  }
  async session_exists(_0xa56c46) {
    return await this.store.containsSession(new SignalProtocolAddress(_0xa56c46, 1));
  }
  async removeSession(_0x3c169d) {
    return await this.store.removeSession(new SignalProtocolAddress(_0x3c169d, 1));
  }
  async removeSenderKey(_0x52702e, _0xde0d1b) {
    return this.store.removeSenderKey(_0x52702e, _0xde0d1b);
  }
  trust_identity(_0x52a639, _0x3a65db) {
    this.store.saveIdentity(_0x52a639, _0x3a65db);
  }
}
module.exports = Signal;