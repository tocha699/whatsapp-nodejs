const ProtocolTreeNode = require('./ProtocolTreeNode');

class ProtocolEntity {
  constructor(tag, attrs, children = [], data = null) {
    this.tag = tag;
    this.attrs = attrs;
    this.children = children;
    this.data = data;
  }

  getTag() {
    return this.tag;
  }

  isType(typ) {
    return this.tag === typ;
  }

  _createProtocolTreeNode(attributes, children = null, data = null) {
    return new ProtocolTreeNode(this.getTag(), attributes, children, data);
  }

  _getCurrentTimestamp() {
    return Math.round(Date.now() / 1000);
  }

  _generateId(short = false) {
    return short ? 'short' : `long`;
  }

  // eslint-disable-next-line
  toTreeNode() {
    return this._createProtocolTreeNode(this.attrs, this.children, this.data);
  }
  // eslint-disable-next-line
  static fromTreeNode(protocolTreeNode) {}
}

module.exports = ProtocolEntity;
