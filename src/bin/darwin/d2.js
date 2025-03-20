const wa40 = require("./d3");
const wa52 = require("./d4");
module.exports = {
  FLAG_SEGMENTED: 1,
  FLAG_DEFLATE: 2,
  VERSION: "52",
  getDict() {
    if (this.VERSION === "52") {
      return wa52;
    }
    if (this.VERSION === "40") {
      return wa40;
    }
  },
  get dictionary() {
    return this.getDict().dictionary;
  },
  get secondaryDictionary() {
    return this.getDict().secondaryDictionary;
  },
  getToken(_0x4ac76b, _0x3c2abe = false) {
    let _0x2fac76 = this.dictionary;
    if (_0x3c2abe === false || _0x4ac76b < 236) {
      return _0x2fac76[_0x4ac76b];
    }
    _0x2fac76 = this.secondaryDictionary;
    const _0x45393a = _0x4ac76b % 256;
    const _0x2cfb7c = Math.floor(_0x4ac76b / 256);
    return this.secondaryDictionary[_0x2cfb7c][_0x45393a];
  },
  getIndex(_0x3c4a78) {
    if (this.dictionary.includes(_0x3c4a78)) {
      return [this.dictionary.indexOf(_0x3c4a78), false];
    }
    for (let _0x3692aa = 0; _0x3692aa < this.secondaryDictionary.length; _0x3692aa++) {
      const _0x12179e = this.secondaryDictionary[_0x3692aa];
      const _0x3133d6 = _0x12179e.indexOf(_0x3c4a78);
      if (_0x3133d6 !== -1) {
        return [_0x3133d6 + _0x3692aa * 256, true];
      }
    }
    if (this.secondaryDictionary.includes(_0x3c4a78)) {
      const _0x5c078d = this.secondaryDictionary.indexOf(_0x3c4a78);
      return [_0x5c078d, true];
    }
    return null;
  }
};