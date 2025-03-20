const dict = require("./d2");
class WriteEncoder {
  protocolTreeNodeToBytes(_0x4c8798) {
    const _0x3149f7 = [0];
    this.writeInternal(_0x4c8798, _0x3149f7);
    return _0x3149f7;
  }
  writeInternal(_0x1f6236, _0x4638f2) {
    let _0x48a4ec = 1 + (_0x1f6236.attributes !== null && typeof _0x1f6236.attributes === "object" ? Object.keys(_0x1f6236.attributes).length * 2 : 0);
    if (_0x1f6236.hasChildren()) {
      _0x48a4ec += 1;
    } else if (_0x1f6236.data !== null) {
      _0x48a4ec += 1;
    }
    this.writeListStart(_0x48a4ec, _0x4638f2);
    this.writeString(_0x1f6236.tag, _0x4638f2);
    this.writeAttributes(_0x1f6236.attributes, _0x4638f2);
    if (_0x1f6236.data !== null) {
      this.writeBytes(Buffer.from(_0x1f6236.data), _0x4638f2);
    }
    if (_0x1f6236.hasChildren()) {
      this.writeListStart(_0x1f6236.children.length, _0x4638f2);
      for (let _0x1110c6 = 0; _0x1110c6 < _0x1f6236.children.length; _0x1110c6++) {
        const _0x15442d = _0x1f6236.children[_0x1110c6];
        this.writeInternal(_0x15442d, _0x4638f2);
      }
    }
  }
  writeAttributes(_0x16406d, _0x15e76e) {
    if (_0x16406d !== null) {
      Object.keys(_0x16406d).forEach(_0x54d4e1 => {
        const _0x1237e9 = _0x16406d[_0x54d4e1];
        this.writeString(_0x54d4e1, _0x15e76e);
        this.writeString(_0x1237e9, _0x15e76e, true);
      });
    }
  }
  writeBytes(_0x39a4dd, _0x56cb29, _0x31fe5f = false) {
    const _0x579b4e = [];
    for (let _0x21833f = 0; _0x21833f < _0x39a4dd.length; _0x21833f++) {
      const _0x1503d7 = _0x39a4dd[_0x21833f];
      if (typeof _0x1503d7 === "number") {
        _0x579b4e.push(_0x1503d7);
      } else {
        _0x579b4e.push(String(_0x1503d7).charCodeAt(0));
      }
    }
    const _0x4796de = _0x579b4e.length;
    let _0x3134d9 = _0x579b4e;
    if (_0x4796de >= 1048576) {
      _0x56cb29.push(254);
      this.writeInt31(_0x4796de, _0x56cb29);
    } else if (_0x4796de >= 256) {
      _0x56cb29.push(253);
      this.writeInt20(_0x4796de, _0x56cb29);
    } else {
      let _0xce0c67 = null;
      if (_0x31fe5f) {
        if (_0x4796de < 128) {
          _0xce0c67 = this.tryPackAndWriteHeader(255, _0x579b4e, _0x56cb29);
          if (_0xce0c67 === null) {
            _0xce0c67 = this.tryPackAndWriteHeader(251, _0x579b4e, _0x56cb29);
          }
        }
      }
      if (_0xce0c67 === null) {
        _0x56cb29.push(252);
        this.writeInt8(_0x4796de, _0x56cb29);
      } else {
        _0x3134d9 = _0xce0c67;
      }
    }
    if (_0x3134d9 && _0x3134d9.length) {
      while (_0x3134d9.length) {
        _0x56cb29.push(_0x3134d9.shift());
      }
    }
  }
  writeInt8(_0x54b579, _0x11df73) {
    _0x11df73.push(_0x54b579 & 255);
  }
  writeInt16(_0x25ad49, _0xf02974) {
    _0xf02974.push((_0x25ad49 & 65280) >> 8);
    _0xf02974.push((_0x25ad49 & 255) >> 0);
  }
  writeInt20(_0x266d16, _0x150419) {
    _0x150419.push((_0x266d16 & 983040) >> 16);
    _0x150419.push((_0x266d16 & 65280) >> 8);
    _0x150419.push((_0x266d16 & 255) >> 0);
  }
  writeInt24(_0x526e27, _0x206cd1) {
    _0x206cd1.push((_0x526e27 & 16711680) >> 16);
    _0x206cd1.push((_0x526e27 & 65280) >> 8);
    _0x206cd1.push((_0x526e27 & 255) >> 0);
  }
  writeInt31(_0x102dec, _0x1976f5) {
    _0x1976f5.push((_0x102dec & 2130706432) >> 24);
    _0x1976f5.push((_0x102dec & 16711680) >> 16);
    _0x1976f5.push((_0x102dec & 65280) >> 8);
    _0x1976f5.push((_0x102dec & 255) >> 0);
  }
  writeListStart(_0x5e2313, _0x37d9c2) {
    if (_0x5e2313 === 0) {
      _0x37d9c2.push(0);
    } else if (_0x5e2313 < 256) {
      _0x37d9c2.push(248);
      this.writeInt8(_0x5e2313, _0x37d9c2);
    } else {
      _0x37d9c2.push(249);
      this.writeInt16(_0x5e2313, _0x37d9c2);
    }
  }
  writeToken(_0x1e0d85, _0x1203e7) {
    if (_0x1e0d85 <= 255 && _0x1e0d85 >= 0) {
      _0x1203e7.push(_0x1e0d85);
    } else {
      throw new Error("Invalid token: " + _0x1e0d85);
    }
  }
  writeString(_0x39f7f2, _0x1d55d0, _0x3d1ed7 = false) {
    const _0x142327 = dict.getIndex(_0x39f7f2);
    if (_0x142327) {
      const [_0x56edea, _0x28fc97] = _0x142327;
      if (!_0x28fc97) {
        this.writeToken(_0x56edea, _0x1d55d0);
      } else {
        let _0x5b5a4a;
        const _0x3de211 = Math.floor(_0x56edea / 256);
        if (_0x3de211 === 0) {
          _0x5b5a4a = 236;
        } else if (_0x3de211 === 1) {
          _0x5b5a4a = 237;
        } else if (_0x3de211 === 2) {
          _0x5b5a4a = 238;
        } else if (_0x3de211 === 3) {
          _0x5b5a4a = 239;
        } else {
          throw new Error("Double byte dictionary token out of range");
        }
        this.writeToken(_0x5b5a4a, _0x1d55d0);
        this.writeToken(_0x56edea % 256, _0x1d55d0);
      }
    } else {
      const _0x3598da = "@".charCodeAt(0);
      try {
        const _0x1b9986 = Buffer.from(_0x39f7f2).indexOf(_0x3598da);
        if (_0x1b9986 < 1) {
          throw new Error("atIndex < 1");
        } else {
          const _0x5a0d22 = Buffer.from(_0x39f7f2).slice(_0x1b9986 + 1).toString();
          const _0x304ac8 = Buffer.from(_0x39f7f2).slice(0, _0x1b9986).toString();
          this.writeJid(_0x304ac8, _0x5a0d22, _0x1d55d0);
        }
      } catch (_0x191279) {
        this.writeBytes(this.encodeString(_0x39f7f2), _0x1d55d0, _0x3d1ed7);
      }
    }
  }
  encodeString(_0x5d64c4) {
    const _0x4337f8 = [];
    Buffer.from(_0x5d64c4).forEach(_0x387572 => {
      _0x4337f8.push(_0x387572);
    });
    return _0x4337f8;
  }
  writeJid(_0x36767a, _0x3e6407, _0x718cb1) {
    _0x718cb1.push(250);
    if (_0x36767a !== null) {
      this.writeString(_0x36767a, _0x718cb1, true);
    } else {
      this.writeToken(0, _0x718cb1);
    }
    this.writeString(_0x3e6407, _0x718cb1);
  }
  tryPackAndWriteHeader(_0x3405f1, _0x1bdc66, _0x496f7c) {
    const _0x5690bd = _0x1bdc66.length;
    if (_0x5690bd >= 128) {
      return null;
    }
    let _0x341b7c = new Array(Math.floor((_0x5690bd + 1) / 2)).fill(0);
    for (let _0x3b4136 = 0; _0x3b4136 < _0x5690bd; _0x3b4136++) {
      const _0x2fe85b = this.packByte(_0x3405f1, _0x1bdc66[_0x3b4136]);
      if (_0x2fe85b === -1) {
        _0x341b7c = [];
        break;
      }
      const _0x200f07 = Math.floor(_0x3b4136 / 2);
      _0x341b7c[_0x200f07] = _0x341b7c[_0x200f07] | _0x2fe85b << (1 - _0x3b4136 % 2) * 4;
    }
    if (_0x341b7c.length > 0) {
      if (_0x5690bd % 2 === 1) {
        _0x341b7c[_0x341b7c.length - 1] = _0x341b7c[_0x341b7c.length - 1] | 15;
      }
      _0x496f7c.push(_0x3405f1);
      this.writeInt8(_0x5690bd % 2 << 7 | _0x341b7c.length, _0x496f7c);
      return _0x341b7c;
    }
    return null;
  }
  packByte(_0x123828, _0x33a3dd) {
    if (_0x123828 === 251) {
      return this.packHex(_0x33a3dd);
    }
    if (_0x123828 === 255) {
      return this.packNibble(_0x33a3dd);
    }
    return -1;
  }
  packHex(_0x449139) {
    if (_0x449139 >= 48 && _0x449139 < 58) {
      return _0x449139 - 48;
    }
    if (_0x449139 >= 65 && _0x449139 < 71) {
      return 10 + (_0x449139 - 65);
    }
    return -1;
  }
  packNibble(_0x5584e9) {
    if (_0x5584e9 >= 45 && _0x5584e9 < 46) {
      return 10 + (_0x5584e9 - 45);
    }
    if (_0x5584e9 >= 48 && _0x5584e9 < 58) {
      return _0x5584e9 - 48;
    }
    return -1;
  }
}
module.exports = WriteEncoder;