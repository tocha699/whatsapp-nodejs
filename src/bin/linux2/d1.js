const zlib = require("zlib");
const dict = require("./d2");
const ProtocolTreeNode = require("./d7");
const unzip = async _0x4ebe0f => {
  return new Promise((_0x2d43bc, _0x4623ad) => {
    zlib.unzip(_0x4ebe0f, (_0x50327a, _0x5cdea2) => {
      if (_0x50327a) {
        return _0x4623ad(_0x50327a);
      }
      _0x2d43bc(Buffer.from(_0x5cdea2));
    });
  });
};
Buffer.prototype.toArray = function () {
  const _0x224e4b = [];
  this.forEach(_0x5402ea => {
    _0x224e4b.push(_0x5402ea);
  });
  return _0x224e4b;
};
class ReadDecoder {
  async getProtocolTreeNode(_0x136464) {
    let _0x1fb840 = typeof _0x136464 === "string" ? Buffer.from(_0x136464, "base64") : _0x136464;
    if (_0x1fb840[0] && dict.FLAG_DEFLATE !== 0) {
      console.info("zlib\\x20unzip", _0x1fb840.length);
      const _0x34bd54 = await unzip(_0x1fb840.slice(1));
      _0x1fb840 = Buffer.concat([Buffer.from([0]), _0x34bd54]);
      console.info("zlib\\x20unzip\\x20complete", _0x1fb840.length);
    }
    if (_0x1fb840[0] && dict.FLAG_SEGMENTED !== 0) {
      throw new Error("server\\x20to\\x20client\\x20stanza\\x20fragmentation\\x20not\\x20supported");
    }
    _0x1fb840 = _0x1fb840.toArray();
    const _0x28ee4e = this.nextTreeInternal(_0x1fb840.slice(1));
    return _0x28ee4e;
  }
  getToken(_0x372f01, _0x26a6c0) {
    let _0x1768c4 = dict.getToken(_0x372f01);
    if (!_0x1768c4) {
      _0x372f01 = this.readInt8(_0x26a6c0);
      _0x1768c4 = dict.getToken(_0x372f01, true);
      if (!_0x1768c4) {
        throw new Error("Invalid token " + _0x1768c4);
      }
    }
    return _0x1768c4;
  }
  getTokenDouble(_0x1f27f, _0x104798) {
    const _0x34bedb = _0x104798 + _0x1f27f * 256;
    const _0x4c682e = dict.getToken(_0x34bedb, true);
    if (!_0x4c682e) {
      throw new Error("Invalid token " + _0x34bedb);
    }
    return _0x4c682e;
  }
  streamStart(_0x1d6fca) {
    this.streamStarted = true;
    let _0xf3547a = _0x1d6fca.shift();
    const _0x5d3c6c = this.readListSize(_0xf3547a, _0x1d6fca);
    _0xf3547a = _0x1d6fca.shift();
    if (_0xf3547a !== 1) {
      if (_0xf3547a === 236) {
        _0xf3547a = _0x1d6fca.shift() + 237;
      }
      const _0x33b49a = this.getToken(_0xf3547a, _0x1d6fca);
      throw new Error("expecting STREAM_START in streamStart, instead got token: " + _0x33b49a);
    }
    const _0x198e3c = (_0x5d3c6c - 2 + _0x5d3c6c % 2) / 2;
    this.readAttributes(_0x198e3c, _0x1d6fca);
  }
  readNibble(_0x164c31) {
    const _0x422eb7 = this.readInt8(_0x164c31);
    const _0x2e8f52 = Boolean(_0x422eb7 & 128);
    const _0x1302f2 = _0x422eb7 & 127;
    const _0x2407a9 = _0x1302f2 * 2 - (_0x2e8f52 ? 1 : 0);
    const _0x31fe9c = this.readArray(_0x1302f2, _0x164c31);
    let _0xbcbc32 = "";
    for (let _0x5c029b = 0; _0x5c029b < _0x2407a9; _0x5c029b++) {
      const _0x40b0c5 = _0x31fe9c[Number(Math.floor(_0x5c029b / 2))];
      const _0x315e50 = (1 - _0x5c029b % 2) * 4;
      const _0x1fa555 = (_0x40b0c5 & 15 << _0x315e50) >> _0x315e50;
      if ([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].includes(_0x1fa555)) {
        _0xbcbc32 += String(_0x1fa555);
      } else if ([10, 11].includes(_0x1fa555)) {
        _0xbcbc32 += String.fromCharCode(_0x1fa555 - 10 + 45);
      } else {
        throw new Error("Bad nibble " + _0x1fa555);
      }
    }
    return _0xbcbc32;
  }
  readPacked8(_0xe4fc26, _0x41c107) {
    let _0x33bdc6 = this.readInt8(_0x41c107);
    let _0x13f688 = 0;
    if ((_0x33bdc6 & 128) !== 0 && _0xe4fc26 === 251) {
      _0x13f688 = 1;
    }
    _0x33bdc6 &= 127;
    const _0x55a407 = Buffer.from(this.readArray(_0x33bdc6, _0x41c107));
    const _0x4a1bdb = _0x55a407.toString("hex").toUpperCase();
    const _0x568ee2 = _0x4a1bdb.length;
    let _0x4a9216 = [];
    if (_0x13f688 === 0) {
      for (let _0x361cb0 = 0; _0x361cb0 < _0x568ee2; _0x361cb0++) {
        const _0x26c627 = _0x4a1bdb[_0x361cb0];
        const _0x3c1a65 = Buffer.from("0" + _0x26c627, "hex")[0];
        if (_0x361cb0 === _0x568ee2 - 1 && _0x3c1a65 > 11 && _0xe4fc26 !== 251) {
          continue;
        }
        _0x4a9216.push(this.unpackByte(_0xe4fc26, _0x3c1a65));
      }
    } else {
      _0x4a9216 = _0x4a1bdb.slice(0, _0x13f688 * -1).split("").map(_0x3e1deb => {
        return String(_0x3e1deb).charCodeAt(0);
      });
    }
    return _0x4a9216;
  }
  unpackByte(_0x52a519, _0xe02a45) {
    if (_0x52a519 === 251) {
      return this.unpackHex(_0xe02a45);
    }
    if (_0x52a519 === 255) {
      return this.unpackNibble(_0xe02a45);
    }
    throw new Error("bad packed type " + _0x52a519);
  }
  unpackHex(_0x2bab06) {
    if (_0x2bab06 >= 0 && _0x2bab06 < 10) {
      return _0x2bab06 + 48;
    }
    if (_0x2bab06 >= 10 && _0x2bab06 < 16) {
      return 65 + (_0x2bab06 - 10);
    }
    throw new Error("bad hex " + _0x2bab06);
  }
  unpackNibble(_0x153fe2) {
    if (_0x153fe2 >= 0 && _0x153fe2 < 10) {
      return _0x153fe2 + 48;
    }
    if (_0x153fe2 >= 10 && _0x153fe2 < 11) {
      return 45 + (_0x153fe2 - 10);
    }
    throw new Error("bad nibble " + _0x153fe2);
  }
  readHeader(_0x2f9a37, _0x7d6e12 = 0) {
    let _0x55d205 = 0;
    if (_0x2f9a37.length >= 3 + _0x7d6e12) {
      const _0x7e6152 = _0x2f9a37[_0x7d6e12];
      const _0x41c04c = _0x2f9a37[_0x7d6e12 + 1];
      const _0x2d587d = _0x2f9a37[_0x7d6e12 + 2];
      _0x55d205 = _0x7e6152 + (_0x41c04c << 16) + (_0x2d587d << 8);
    }
    return _0x55d205;
  }
  readInt8(_0x554db3) {
    return _0x554db3.shift();
  }
  readInt16(_0x3ad57e) {
    const _0x3b005e = _0x3ad57e.shift();
    const _0x48d7a2 = _0x3ad57e.shift();
    const _0x2a6b3d = (_0x3b005e << 8) + _0x48d7a2;
    return _0x2a6b3d || "";
  }
  readInt20(_0x28992e) {
    const _0x5e6c3e = _0x28992e.shift();
    const _0x588b3d = _0x28992e.shift();
    const _0x9d02e2 = _0x28992e.shift();
    return (_0x5e6c3e & 15) << 16 | _0x588b3d << 8 | _0x9d02e2;
  }
  readInt24(_0x23cd6a) {
    const _0x4e2b13 = _0x23cd6a.shift();
    const _0x29f7c0 = _0x23cd6a.shift();
    const _0x59146b = _0x23cd6a.shift();
    const _0x5ca193 = (_0x4e2b13 << 16) + (_0x29f7c0 << 8) + (_0x59146b << 0);
    return _0x5ca193;
  }
  readInt31(_0x56963c) {
    _0x56963c.shift();
    const _0x8dd6b = _0x56963c.shift();
    const _0x2a18cc = _0x56963c.shift();
    const _0x1a306e = _0x56963c.shift();
    return _0x8dd6b << 24 | _0x8dd6b << 16 | _0x2a18cc << 8 | _0x1a306e;
  }
  readListSize(_0x41d121, _0x3f7976) {
    let _0x400305 = 0;
    if (_0x41d121 === 0) {
      _0x400305 = 0;
    } else if (_0x41d121 === 248) {
      _0x400305 = this.readInt8(_0x3f7976);
    } else if (_0x41d121 === 249) {
      _0x400305 = this.readInt16(_0x3f7976);
    } else {
      throw new Error("invalid list size in readListSize: token " + String(_0x41d121));
    }
    return _0x400305;
  }
  readAttributes(_0x15b8f7, _0x50c5a1) {
    const _0x944c83 = {};
    for (let _0x26bcee = 0; _0x26bcee < Number(_0x15b8f7); _0x26bcee++) {
      const _0x4682d6 = this.readString(this.readInt8(_0x50c5a1), _0x50c5a1).toString("utf8");
      const _0x281c09 = this.readString(this.readInt8(_0x50c5a1), _0x50c5a1).toString("utf8");
      _0x944c83[_0x4682d6] = _0x281c09;
    }
    return _0x944c83;
  }
  readString(_0x1b470c, _0x595370) {
    if (_0x1b470c === -1) {
      throw new Error("-1 token in readString");
    }
    if (_0x1b470c > 2 && _0x1b470c < 236) {
      return this.getToken(_0x1b470c, _0x595370);
    }
    if (_0x1b470c === 0) {
      return "";
    }
    if ([236, 237, 238, 239].includes(_0x1b470c)) {
      return this.getTokenDouble(_0x1b470c - 236, this.readInt8(_0x595370));
    }
    if (_0x1b470c === 247) {
      const _0x3762e4 = this.readInt8(_0x595370);
      const _0x570bc5 = this.readInt8(_0x595370);
      const _0xf48552 = this.readString(_0x595370.shift(), _0x595370);
      const _0x45129b = _0xf48552 + "." + _0x3762e4 + ":" + _0x570bc5 + "@s.whatsapp.net";
      return _0x45129b;
    }
    if (_0x1b470c === 250) {
      const _0x34d24d = this.readString(_0x595370.shift(), _0x595370);
      const _0x510af6 = this.readString(_0x595370.shift(), _0x595370);
      if (_0x34d24d && _0x510af6) {
        return _0x34d24d + "@" + _0x510af6;
      }
      if (_0x510af6) {
        return _0x510af6;
      }
      throw new Error("readString couldn't reconstruct jid");
    }
    if ([251, 255].includes(_0x1b470c)) {
      return Buffer.from(this.readPacked8(_0x1b470c, _0x595370));
    }
    if (_0x1b470c === 252) {
      const _0xd05985 = this.readInt8(_0x595370);
      const _0x5dcd52 = this.readArray(_0xd05985, _0x595370);
      return Buffer.from(_0x5dcd52);
    }
    if (_0x1b470c === 253) {
      const _0x4b05e5 = this.readInt20(_0x595370);
      const _0x4c321c = this.readArray(_0x4b05e5, _0x595370);
      return Buffer.from(_0x4c321c);
    }
    if (_0x1b470c === 254) {
      const _0x1f7899 = this.readInt31();
      const _0x4b5a8a = this.readArray(_0x1f7899, _0x595370);
      return Buffer.from(_0x4b5a8a);
    }
    throw new Error("readString couldn't match token " + String(_0x1b470c));
  }
  readArray(_0xa12eda, _0x5df5e8) {
    const _0x30397b = [];
    for (let _0x4420ad = 0; _0x4420ad < _0xa12eda; _0x4420ad++) {
      _0x30397b.push(_0x5df5e8.shift());
    }
    return _0x30397b;
  }
  nextTreeInternal(_0x4d69b4) {
    let _0x470e1b = this.readListSize(this.readInt8(_0x4d69b4), _0x4d69b4);
    let _0xaab6f6 = this.readInt8(_0x4d69b4);
    if (_0xaab6f6 === 1) {
      _0xaab6f6 = this.readInt8(_0x4d69b4);
    }
    if (_0xaab6f6 === 2) {
      return "";
    }
    const _0x2d2616 = this.readString(_0xaab6f6, _0x4d69b4);
    if (_0x470e1b === 0 || !_0x2d2616) {
      throw new Error("nextTree sees 0 list or null tag");
    }
    const _0x4add6b = (_0x470e1b - 2 + _0x470e1b % 2) / 2;
    const _0x26c5c8 = this.readAttributes(_0x4add6b, _0x4d69b4);
    if (_0x470e1b % 2 === 1) {
      return new ProtocolTreeNode(_0x2d2616.toString(), _0x26c5c8);
    }
    const _0x993ded = this.readInt8(_0x4d69b4);
    let _0x4dad5c = "";
    let _0x46199c = "";
    if (this.isListTag(_0x993ded)) {
      _0x46199c = this.readList(_0x993ded, _0x4d69b4);
    } else if (_0x993ded === 252) {
      _0x470e1b = this.readInt8(_0x4d69b4);
      _0x4dad5c = this.readArray(_0x470e1b, _0x4d69b4);
    } else if (_0x993ded === 253) {
      _0x470e1b = this.readInt20(_0x4d69b4);
      _0x4dad5c = this.readArray(_0x470e1b, _0x4d69b4);
    } else if (_0x993ded === 254) {
      _0x470e1b = this.readInt31(_0x4d69b4);
      _0x4dad5c = this.readArray(_0x470e1b, _0x4d69b4);
    } else if ([255, 251].includes(_0x993ded)) {
      _0x4dad5c = this.readPacked8(_0x993ded, _0x4d69b4);
    } else {
      _0x4dad5c = this.readString(_0x993ded, _0x4d69b4);
    }
    if (_0x4dad5c && typeof _0x4dad5c !== "string") {
      _0x4dad5c = Buffer.from(_0x4dad5c);
    }
    return new ProtocolTreeNode(_0x2d2616.toString(), _0x26c5c8, _0x46199c, _0x4dad5c);
  }
  readList(_0x177077, _0x470210) {
    const _0xe3bc3c = this.readListSize(_0x177077, _0x470210);
    const _0x376e63 = [];
    for (let _0x43c307 = 0; _0x43c307 < _0xe3bc3c; _0x43c307++) {
      _0x376e63.push(this.nextTreeInternal(_0x470210));
    }
    return _0x376e63;
  }
  isListTag(_0x1d9e48) {
    return [248, 0, 249].includes(_0x1d9e48);
  }
}
module.exports = ReadDecoder;