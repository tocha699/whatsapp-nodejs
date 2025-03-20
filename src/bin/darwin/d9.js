const { ed25519 } = require("@noble/curves/ed25519");
const got = require("got");
const SocksProxyAgent = require("socks-proxy-agent");
const tunnel = require("tunnel");
const crypto = require("../../protocol/crypto");
const utils = require("../../lib/utils");

class WARequest {
  constructor(_0x39e37f, _0x12233c, _0x598ad3) {
    this.ENC_PUBKEY = Buffer.from("8e8c0f74c3ebc5d7a6865c6c3c843856b06121cce8ea774d22fb6f122512302d", "hex");
    this.signal = _0x39e37f;
    this.config = _0x12233c;
    this.account = _0x598ad3;
    this.url = "";
    this.params = {};
    this.headers = {
      Accept: "text/json",
      request_token: utils.generateUUID(),
      WaMsysRequest: 1,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "WhatsApp/" + _0x12233c.version + " Android/" + _0x598ad3.osVersion + " Device/" + _0x598ad3.manufacturer + "-" + _0x598ad3.deviceName
    };
  }
  numberToBuffer(_0x36154e, _0x5952e6) {
    let _0x18f220 = String(Number(_0x36154e).toString(16));
    if (_0x18f220.length % 2 === 1) {
      _0x18f220 = "0" + _0x18f220;
    }
    if (_0x5952e6 && _0x18f220.length < _0x5952e6) {
      _0x18f220 = new Array(_0x5952e6 - _0x18f220.length + 1).join("0") + _0x18f220;
    }
    return Buffer.from(_0x18f220, "hex");
  }
  async init() {
    const _0x107873 = Buffer.from(this.account.clientStaticKeypair, "base64");
    const _0x2e41c0 = {
      public: _0x107873.slice(-32),
      private: _0x107873.slice(0, 32)
    };
    const {
      identityKeyPair: _0x559253
    } = this.signal;
    const {
      registrationId: _0x5dcbac
    } = this.signal;
    const _0x4be7cd = await this.signal.loadLatestSignedPrekey(true);
    this._p_in = this.account.mobile.substr(this.account.cc.length);
    this.addParam("cc", this.account.cc);
    this.addParam("in", this._p_in);
    this.addParam("lg", this.account.lg || "en");
    this.addParam("lc", this.account.lc || "GB");
    this.addParam("mistyped", "6");
    this.addParam("authkey", _0x2e41c0.public.toString("base64"));
    this.addParam("e_regid", this.numberToBuffer(_0x5dcbac, 8).toString("base64"));
    this.addParam("e_keytype", "BQ");
    this.addParam("e_ident", Buffer.from(_0x559253.pubKey).slice(1).toString("base64"));
    this.addParam("e_skey_id", this.numberToBuffer(_0x4be7cd.keyId, 8).slice(1).toString("base64"));
    this.addParam("e_skey_val", Buffer.from(_0x4be7cd.keyPair.pubKey).slice(1).toString("base64"));
    this.addParam("e_skey_sig", Buffer.from(_0x4be7cd.signature).toString("base64"));
    this.addParam("fdid", this.account.fdid);
    this.addParam("expid", this.account.expid);
    this.addParam("network_radio_type", "1");
    this.addParam("simnum", "1");
    this.addParam("hasinrc", "1");
    this.addParam("pid", Math.floor(Math.random() * 9899) + 100);
    this.addParam("rc", 0);
  }
  addParam(_0x46c71b, _0x48ed25) {
    this.params[_0x46c71b] = _0x48ed25;
  }
  urlencode(_0x4f1598) {
    let _0x23d40f = "";
    if (_0x4f1598 instanceof Buffer) {
      for (let _0x12bf8a = 0; _0x12bf8a < _0x4f1598.length; _0x12bf8a++) {
        const _0x107120 = _0x4f1598[_0x12bf8a];
        if (_0x107120 > 126 || _0x107120 < 32) {
          let _0x562a4b = Number(_0x107120).toString(16);
          if (_0x562a4b.length === 1) {
            _0x562a4b = "0" + _0x562a4b;
          }
          _0x23d40f += String("%" + _0x562a4b).toLowerCase();
        } else {
          const _0x583e97 = encodeURIComponent(String.fromCharCode(_0x107120));
          _0x23d40f += _0x583e97[0] !== "%" ? _0x583e97 : String(_0x583e97).toLowerCase();
        }
      }
    } else {
      _0x4f1598 = String(_0x4f1598);
      for (let _0x343a4d = 0; _0x343a4d < _0x4f1598.length; _0x343a4d++) {
        const _0x104544 = _0x4f1598[_0x343a4d];
        const _0xb23b5a = encodeURIComponent(_0x104544);
        _0x23d40f += _0xb23b5a[0] !== "%" ? _0xb23b5a : String(_0xb23b5a).toLowerCase();
      }
    }
    return _0x23d40f.replace(/-/g, "%2d").replace(/_/g, "%5f").replace(/~/g, "%7e");
  }
  urlencodeParams(_0x30f693) {
    return Object.keys(_0x30f693).map(_0x36c406 => {
      return _0x36c406 + "=" + this.urlencode(_0x30f693[_0x36c406]);
    }).join("&");
  }
  quoteUrl(_0x1a9df8, _0x45cb61) {
    if (typeof _0x45cb61 !== "string") {
      _0x45cb61 = "/";
    }
    _0x1a9df8 = encodeURIComponent(_0x1a9df8);
    const _0x443fe1 = [];
    for (let _0x216c3a = _0x45cb61.length - 1; _0x216c3a >= 0; --_0x216c3a) {
      const _0x4be5c1 = encodeURIComponent(_0x45cb61[_0x216c3a]);
      if (_0x4be5c1 !== _0x45cb61.charAt(_0x216c3a)) {
        _0x443fe1.push(_0x4be5c1);
      }
    }
    _0x1a9df8 = _0x1a9df8.replace(new RegExp(_0x443fe1.join("|"), "ig"), decodeURIComponent);
    return _0x1a9df8;
  }
  encryptParams(_0x14694e, _0x49ee9a) {
    const _0x5c3477 = this.urlencodeParams(_0x14694e);
    const _0x1d4814 = crypto.randomBytes(32);
    const _0x429486 = ed25519.utils.randomPrivateKey();
    const _0x340621 = ed25519.getPublicKey(_0x429486);
    const _0x11621c = ed25519.getSharedSecret(_0x429486, _0x49ee9a).toString("base64");
    const _0x48b06a = crypto.encryptAES256GCM(Buffer.from(_0x5c3477), _0x11621c);
    const _0x1d741e = Buffer.concat([_0x340621, _0x48b06a]).toString("base64");
    return _0x1d741e;
  }
  decryptParams(_0x42291b) {
    let _0x2c4c19 = Buffer.from(_0x42291b, "base64");
    const _0x591993 = _0x2c4c19.slice(0, 32);
    _0x2c4c19 = _0x2c4c19.slice(32);
    const _0x4d3957 = ed25519.getSharedSecret(_0x591993, this.ENC_PUBKEY).toString("base64");
    const _0x54c717 = crypto.decryptAES256GCM(_0x2c4c19.toString("base64"), _0x4d3957).toString("base64");
    return _0x54c717;
  }
  setProxy(_0x35f493) {
    this.proxy = _0x35f493;
  }
  async get() {
    console.log(this.params);
    const _0x19663b = this.encryptParams(this.params, this.ENC_PUBKEY);
    const _0x4c6207 = {
      headers: this.headers,
      responseType: "json",
      timeout: 10000,
      retry: {
        limit: 0
      },
      https: {
        rejectUnauthorized: false
      }
    };
    if (this.proxy) {
      const _0x2f5607 = {
        host: this.proxy.host,
        port: this.proxy.port
      };
      if (this.proxy.type !== "http") {
        if (this.proxy.userId) {
          _0x2f5607.userId = this.proxy.userId || "";
          _0x2f5607.password = this.proxy.password;
        }
        const _0xc70bd0 = new SocksProxyAgent(_0x2f5607);
        _0x4c6207.agent = {
          https: _0xc70bd0
        };
      } else {
        if (this.proxy.userId) {
          _0x2f5607.proxyAuth = this.proxy.userId + ":" + this.proxy.password;
        }
        const _0x3b53f8 = tunnel.httpsOverHttp({
          proxy: _0x2f5607
        });
        _0x4c6207.agent = {
          https: _0x3b53f8
        };
      }
    }
    let _0x31d8ae;
    try {
      _0x31d8ae = await got.get(this.url + _0x19663b, _0x4c6207);
    } catch (_0x496f54) {
      console.error(_0x496f54);
      throw new Error(_0x496f54);
    }
    if (_0x31d8ae) {
      return _0x31d8ae.body || {};
    } else {
      return {};
    }
  }
}
module.exports = WARequest;