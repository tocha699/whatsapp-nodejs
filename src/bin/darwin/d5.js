const CipherState = require("../../protocol/handshake/CipherState");
const WASymmetricState = require("../../protocol/handshake/WASymmetricState");
const HandshakeState = require("../../protocol/handshake/HandshakeState");
const SwitchableHandshakeState = require("../../protocol/handshake/SwitchableHandshakeState");
const IKHandshakePattern = require("../../protocol/handshake/handshakepatterns/IKHandshakePattern");
const FallbackPatternModifier = require("../../protocol/handshake/FallbackPatternModifier");
const XXHandshakePattern = require("../../protocol/handshake/handshakepatterns/XXHandshakePattern");
const {
  ClientHello,
  HandshakeMessage
} = require("../../protobuf/pb");
class HandShake {
  constructor(_0x5957a0) {
    this.waSocketClient = _0x5957a0;
    const _0x5d0d2a = 5;
    const _0x5e714f = 2;
    const _0x1d02d3 = Buffer.from([_0x5d0d2a, _0x5e714f]);
    this.HEADER = Buffer.concat([Buffer.from("WA"), _0x1d02d3]);
    this.EDGE_HEADER = Buffer.concat([Buffer.from("ED"), Buffer.from([0, 1])]);
    const _0x21fc28 = new CipherState("AESGCM");
    const _0x56fdff = new WASymmetricState(_0x21fc28);
    this.handshakeState = new SwitchableHandshakeState(new HandshakeState(_0x56fdff));
    this.isLogin = false;
  }
  get rs() {
    return this.handshakeState.rs || null;
  }
  async start(_0xd8c5fc, _0x415b39) {
    let _0x5d4bc8 = Buffer.from(_0xd8c5fc.clientStaticKeypair, "base64");
    _0x5d4bc8 = {
      private: _0x5d4bc8.slice(0, 32),
      public: _0x5d4bc8.slice(-32)
    };
    let _0x3e0eac;
    if (_0x415b39) {
      console.debug("start\\x20use\\x20startHandshakeIK");
      _0x3e0eac = await this.startHandshakeIK(_0xd8c5fc, _0x5d4bc8, _0x415b39);
    } else {
      console.debug("start\\x20use\\x20startHandshakeXX");
      _0x3e0eac = await this.startHandshakeXX(_0xd8c5fc, _0x5d4bc8);
    }
    console.info("Handshake\\x20success.");
    return _0x3e0eac;
  }
  async startHandshakeXX(_0x13a7a6, _0x58ce04) {
    return new Promise(_0x88609a => {
      const _0x5c3ea0 = new XXHandshakePattern();
      this.handshakeState.initialize(_0x5c3ea0, true, this.HEADER, _0x58ce04);
      this.waSocketClient.send(this.HEADER, false);
      this.handshakeState.write_message(Buffer.alloc(0), []);
      const _0x4a9f83 = this.handshakeState.e.public;
      console.debug("send\\x20local\\x20public\\x20key", _0x4a9f83, _0x4a9f83.toString("base64"));
      const _0x5197ee = HandshakeMessage.HandshakeMessage.encode(HandshakeMessage.HandshakeMessage.create({
        clientHello: {
          ephemeral: _0x4a9f83
        }
      })).finish();
      this.waSocketClient.send(_0x5197ee);
      this.waSocketClient.once("data", async _0x6405ec => {
        console.debug("recv\\x20server\\x20public\\x20key", _0x6405ec);
        const {
          serverHello: _0x47abda
        } = HandshakeMessage.HandshakeMessage.decode(_0x6405ec).toJSON();
        console.debug("serverHello", _0x47abda);
        const _0x115046 = Buffer.concat([Buffer.from(_0x47abda.ephemeral, "base64"), Buffer.from(_0x47abda.static, "base64"), Buffer.from(_0x47abda.payload, "base64")]);
        this.handshakeState.read_message(_0x115046, []);
        const _0x36112a = this.createPayload(_0x13a7a6);
        const _0xa6803f = [];
        const _0x18abc0 = this.handshakeState.write_message(_0x36112a, _0xa6803f);
        const _0xdf789f = Buffer.from(_0xa6803f);
        const _0x34e5b7 = HandshakeMessage.HandshakeMessage.encode(HandshakeMessage.HandshakeMessage.create({
          clientFinish: {
            static: _0xdf789f.slice(0, 48),
            payload: _0xdf789f.slice(48)
          }
        })).finish();
        this.waSocketClient.send(_0x34e5b7);
        console.debug("send\\x20client\\x20finish\\x20buffer.");
        [this.sendCipherState, this.recvCipherState] = _0x18abc0;
        this.isLogin = true;
        _0x88609a(_0x18abc0);
      });
    });
  }
  async startHandshakeIK(_0x116e9d, _0xc04351, _0x2575a3) {
    const _0x3e9741 = new IKHandshakePattern();
    this.handshakeState.initialize(_0x3e9741, true, this.HEADER, _0xc04351, null, _0x2575a3);
    const _0x16a4f0 = this.createPayload(_0x116e9d);
    const _0x5560b9 = [];
    this.handshakeState.write_message(_0x16a4f0, _0x5560b9);
    const _0x1190c2 = Buffer.from(_0x5560b9);
    const _0x191ac6 = _0x1190c2.slice(0, 32);
    const _0x373329 = _0x1190c2.slice(32, 80);
    const _0x3e79f3 = _0x1190c2.slice(80);
    const _0x26a290 = HandshakeMessage.HandshakeMessage.encode(HandshakeMessage.HandshakeMessage.create({
      clientHello: {
        ephemeral: _0x191ac6,
        static: _0x373329,
        payload: _0x3e79f3
      }
    })).finish();
    this.waSocketClient.send(this.EDGE_HEADER, false);
    this.waSocketClient.send(_0x116e9d.edgeRoutingInfo || "CAwIBQ==");
    this.waSocketClient.send(this.HEADER, false);
    this.waSocketClient.send(_0x26a290);
    return new Promise((_0x8c3978, _0x3f1185) => {
      this.waSocketClient.once("data", async _0x132ad2 => {
        const {
          serverHello: _0x5ee91c
        } = HandshakeMessage.HandshakeMessage.decode(_0x132ad2).toJSON();
        console.debug("serverHello", _0x5ee91c);
        if (_0x5ee91c.static && _0x5ee91c.static.length) {
          console.info("start\\x20use\\x20switchHandshakeXXFallback");
          const _0x396fe7 = await this.switchHandshakeXXFallback(_0xc04351, _0x16a4f0, _0x5ee91c);
          _0x8c3978(_0x396fe7);
          return;
        }
        _0x5ee91c.static = Buffer.alloc(0);
        if (_0x5ee91c.static && _0x5ee91c.static.length) {
          _0x5ee91c.static = Buffer.from(_0x5ee91c.static, "base64");
        }
        const _0x5558fb = Buffer.concat([Buffer.from(_0x5ee91c.ephemeral, "base64"), _0x5ee91c.static, Buffer.from(_0x5ee91c.payload, "base64")]);
        const _0x5532c4 = this.handshakeState.read_message(_0x5558fb, []);
        [this.sendCipherState, this.recvCipherState] = _0x5532c4;
        this.isLogin = true;
        _0x8c3978(_0x5532c4);
      });
    });
  }
  async switchHandshakeXXFallback(_0x3349dd, _0x26e3e6, _0x3a87e7) {
    console.debug("switchHandshakeXXFallback");
    this.handshakeState.switch(new FallbackPatternModifier().modify(new XXHandshakePattern()), true, this.HEADER, _0x3349dd);
    const _0x11a505 = [];
    const _0x97c606 = Buffer.concat([Buffer.from(_0x3a87e7.ephemeral, "base64"), Buffer.from(_0x3a87e7.static, "base64"), Buffer.from(_0x3a87e7.payload, "base64")]);
    this.handshakeState.read_message(_0x97c606, _0x11a505);
    const _0x5167fe = [];
    const _0x5474f9 = this.handshakeState.write_message(_0x26e3e6, _0x5167fe);
    const _0x733761 = Buffer.from(_0x5167fe);
    const _0x4a9844 = HandshakeMessage.HandshakeMessage.encode(HandshakeMessage.HandshakeMessage.create({
      clientFinish: {
        static: _0x733761.slice(0, 48),
        payload: _0x733761.slice(48)
      }
    })).finish();
    this.waSocketClient.send(_0x4a9844);
    [this.sendCipherState, this.recvCipherState] = _0x5474f9;
    this.isLogin = true;
    return _0x5474f9;
  }
  generatePushName() {
    const _0xc535e9 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const _0x7d7306 = Math.floor(Math.random() * 4 + 4);
    let _0x44495c = "";
    const _0x383272 = _0xc535e9.length;
    for (let _0x2a7873 = 0; _0x2a7873 < _0x7d7306; _0x2a7873++) {
      _0x44495c += _0xc535e9[Math.floor(Math.random() * _0x383272)];
    }
    return _0x44495c;
  }
  createPayload(_0x57d828) {
    console.debug("client version:", _0x57d828.version);
    console.debug("account:", _0x57d828.cc, _0x57d828.mobile, _0x57d828.mcc, _0x57d828.mnc, "platform", _0x57d828.platform);
    console.debug("client info:", _0x57d828.oSVersion, _0x57d828.manufacturer, _0x57d828.deviceName);
    const _0x422cdf = _0x57d828.version.split(".");
    const _0x16d959 = {
      username: _0x57d828.mobile,
      passive: false,
      useragent: {
        platform: _0x57d828.platform || 0,
        appVersion: {
          primary: _0x422cdf[0],
          secondary: _0x422cdf[1],
          tertiary: _0x422cdf[2],
          quaternary: _0x422cdf[3]
        },
        mcc: _0x57d828.mcc || "000",
        mnc: _0x57d828.mnc || "000",
        osVersion: _0x57d828.oSVersion,
        manufacturer: _0x57d828.manufacturer,
        device: _0x57d828.deviceName,
        osBuildNumber: _0x57d828.oSVersion,
        phoneId: _0x57d828.fdid || "",
        localeLanguageIso_639_1: _0x57d828.lg || "en",
        localeCountryIso_3166_1Alpha_2: _0x57d828.lc || "US",
        device2: "unknown"
      },
      pushName: _0x57d828.pushName || this.generatePushName(),
      sessionId: Math.floor(Math.random() * 4294967296) + 1,
      shortConnect: false,
      connectType: 1
    };
    if (Number(_0x57d828.platform) === 10) {
      _0x16d959.tag23 = 1;
      _0x16d959.tag24 = 5;
    }
    const _0x532796 = ClientHello.C2S;
    const _0x574f1c = _0x532796.encode(_0x532796.create(_0x16d959)).finish();
    return _0x574f1c;
  }
  toBuffer(_0x1a1704) {
    if (typeof _0x1a1704 === "undefined") {
      return Buffer.alloc(0);
    }
    if (typeof _0x1a1704 === "string") {
      return Buffer.from(_0x1a1704, "base64");
    } else {
      return Buffer.from(_0x1a1704);
    }
  }
  decrypt(_0x5ba9c0) {
    return this.recvCipherState.decryptAES256GCM(Buffer.alloc(0), this.toBuffer(_0x5ba9c0));
  }
  encrypt(_0x344960) {
    return this.sendCipherState.encryptAES256GCM(Buffer.alloc(0), this.toBuffer(_0x344960));
  }
}
module.exports = HandShake;