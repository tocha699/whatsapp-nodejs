const WriteEncoder = require("./d0");
class ProtocolTreeNode {
  constructor(_0x25b019, _0x245f90 = null, _0x227e55 = null, _0x351ba8 = null) {
    this.tag = _0x25b019;
    this.attributes = _0x245f90 || {};
    if (_0x227e55 && !Array.isArray(_0x227e55)) {
      this.children = [_0x227e55];
    } else {
      this.children = _0x227e55 || [];
    }
    this.data = _0x351ba8;
    Object.keys(this.attributes).forEach(_0x23bb64 => {
      if (this.attributes[_0x23bb64] === undefined || this.attributes[_0x23bb64] === null) {
        delete this.attributes[_0x23bb64];
      }
    });
    this.children = this.children.map(_0x570a2f => {
      return new ProtocolTreeNode(_0x570a2f.tag, _0x570a2f.attributes, _0x570a2f.children, _0x570a2f.data);
    });
  }
  toBuffer() {
    try {
      const _0x581846 = new WriteEncoder().protocolTreeNodeToBytes(this);
      return Buffer.from(_0x581846);
    } catch (_0x25546d) {
      console.error("Node failed to serialize buffer", _0x25546d);
    }
  }
  toString() {
    let _0x5556dc = "<" + this.tag;
    if (this.attributes) {
      Object.keys(this.attributes).forEach(_0x147ecf => {
        const _0x37737e = this.attributes[_0x147ecf];
        _0x5556dc += "\\x20" + _0x147ecf + "=\\x22" + _0x37737e + "\\x22";
      });
    }
    _0x5556dc += ">\\x0a";
    if (this.data) {
      if (this.data instanceof Buffer) {
        _0x5556dc += this.data.toString("utf8");
      } else {
        try {
          _0x5556dc += this.data;
        } catch (_0x4acd1c) {
          try {
            _0x5556dc += this.data.toString();
          } catch (_0x2a552b) {
            _0x5556dc += this.data.toString("hex");
          }
        }
      }
      _0x5556dc += "\nHEX3:" + Buffer.from(this.data || "").toString("hex") + "\\x0a";
    }
    for (let _0x7d1ec2 = 0; _0x7d1ec2 < this.children.length; _0x7d1ec2++) {
      const _0x403268 = this.children[_0x7d1ec2];
      try {
        _0x5556dc += _0x403268.toString();
      } catch (_0x73c12) {
        console.error(_0x73c12);
        _0x5556dc += "[ENCODED DATA]\n";
      }
    }
    _0x5556dc += "</" + this.tag + ">\\x0a";
    return _0x5556dc;
  }
  toJSON() {
    const _0x510d12 = {
      tag: this.tag,
      props: this.attributes,
      children: []
    };
    Object.keys(this.attributes).forEach(_0x344868 => {
      let _0x9ac58 = this.attributes[_0x344868];
      if (_0x9ac58 instanceof Buffer) {
        _0x9ac58 = _0x9ac58.toString("utf8");
        this.attributes[_0x344868] = _0x9ac58;
      }
    });
    if (this.data !== null) {
      _0x510d12.data = this.data;
    }
    for (let _0xe3fdc1 = 0; _0xe3fdc1 < this.children.length; _0xe3fdc1++) {
      const _0x2102d0 = this.children[_0xe3fdc1];
      try {
        _0x510d12.children.push(_0x2102d0.toJSON());
      } catch (_0x516650) {
        console.error(_0x516650);
        _0x510d12.children.push("[ENCODED DATA]");
      }
    }
    return _0x510d12;
  }
  toSimpleJSON() {
    const _0x14e165 = {
      [this.tag]: {}
    };
    Object.keys(this.attributes).forEach(_0x1bb7e2 => {
      let _0x106deb = this.attributes[_0x1bb7e2];
      if (_0x106deb instanceof Buffer) {
        _0x106deb = _0x106deb.toString("utf8");
      }
      _0x14e165[this.tag][_0x1bb7e2] = _0x106deb;
    });
    try {
      for (let _0x500ef4 = 0; _0x500ef4 < this.children.length; _0x500ef4++) {
        const _0xafce16 = this.children[_0x500ef4].toSimpleJSON();
        if (!_0xafce16) {
          continue;
        }
        let _0x23fc82 = Object.keys(_0xafce16)[0];
        const _0x2ebf6e = _0xafce16[_0x23fc82];
        if (typeof this.attributes[_0x23fc82] !== "undefined") {
          _0x23fc82 = _0x23fc82 + "_entity";
        }
        if (_0x14e165[this.tag][_0x23fc82]) {
          if (Array.isArray(_0x14e165[this.tag][_0x23fc82])) {
            _0x14e165[this.tag][_0x23fc82].push(_0x2ebf6e);
          } else {
            _0x14e165[this.tag][_0x23fc82] = [_0x14e165[this.tag][_0x23fc82], _0x2ebf6e];
          }
        } else {
          _0x14e165[this.tag][_0x23fc82] = _0x2ebf6e;
        }
      }
    } catch (_0x2cbb16) {
      console.error(_0x2cbb16);
    }
    if (this.data !== null && typeof this.data !== "undefined") {
      _0x14e165[this.tag].entity_value = this.data;
      if (_0x14e165[this.tag].entity_value instanceof Buffer) {
        _0x14e165[this.tag].entity_value = _0x14e165[this.tag].entity_value.toString("utf8");
      }
    }
    return _0x14e165 || {};
  }
  setData(_0x2c29ff) {
    this.data = _0x2c29ff;
  }
  getData() {
    return this.data;
  }
  getChild(_0x5618b6) {
    if (typeof _0x5618b6 === "number") {
      if (this.children.length > _0x5618b6) {
        return this.children[_0x5618b6];
      }
      return null;
    }
    for (let _0x495e5d = 0; _0x495e5d < this.children.length; _0x495e5d++) {
      const _0x11709d = this.children[_0x495e5d];
      if (_0x11709d.tag === _0x5618b6) {
        return _0x11709d;
      }
    }
    return null;
  }
  addChild(_0x568d8b) {
    this.children.push(_0x568d8b);
  }
  addChildren(_0x3e9952) {
    _0x3e9952.forEach(_0x28fc1a => {
      this.addChild(_0x28fc1a);
    });
  }
  hasChildren() {
    return this.children.length > 0;
  }
  getAllChildren(_0x22b2e5 = null) {
    if (!_0x22b2e5) {
      return this.children;
    }
    return this.children.filter(_0x2283d6 => _0x2283d6.tag === _0x22b2e5);
  }
  getAttributeValue(_0x2d05dd) {
    return this.attributes[_0x2d05dd];
  }
  getAttr(_0x3f9915) {
    return this.getAttributeValue(_0x3f9915);
  }
  setAttr(_0x290d08, _0x5ea84e) {
    this.setAttribute(_0x290d08, _0x5ea84e);
  }
  removeAttr(_0x3958d5) {
    delete this.attributes[_0x3958d5];
  }
  removeAttribute(_0x41a5f7) {
    delete this.attributes[_0x41a5f7];
  }
  setAttribute(_0x382e1d, _0x3b79a6) {
    this.attributes[_0x382e1d] = _0x3b79a6;
  }
}
module.exports = ProtocolTreeNode;