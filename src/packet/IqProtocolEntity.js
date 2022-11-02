const ProtocolEntity = require('./ProtocolEntity');

class IqProtocolEntity extends ProtocolEntity {
  /**
   * <iq type="{{get | set}}" id="{{id}}" xmlns="{{xmlns}}" to="{{TO}}" from="{{FROM}}">
    </iq>
   */
  TYPE_SET = 'set';

  TYPE_GET = 'get';

  TYPE_ERROR = 'error';

  TYPE_RESULT = 'result';

  TYPES = ['set', 'get', 'error', 'result'];

  constructor(xmlns = null, _id = null, _type = null, to = null, _from = null) {
    super('iq');
    if (!this.TYPES.includes(_type)) throw new Error(`Iq of type ${_type} is not implemented`);
    this._id = _id || this._generateId(true);
    this._from = _from;
    this._type = _type;
    this.xmlns = xmlns;
    this.to = to;
  }

  getId() {
    return this._id;
  }

  getType() {
    return this._type;
  }

  getXmlns() {
    return this.xmlns;
  }

  getFrom(full = true) {
    return full ? this._from : this._from.split('@')[0];
  }

  getTo() {
    return this.to;
  }

  toProtocolTreeNode() {
    const attribs = {
      id: this._id,
      type: this._type,
    };
    if (this.xmlns) {
      attribs.xmlns = this.xmlns;
    }

    if (this.to) {
      attribs.to = this.to;
    } else if (this._from) {
      attribs.from = this._from;
    }

    return this._createProtocolTreeNode(attribs, null, null);
  }

  static fromProtocolTreeNode(node) {
    return new IqProtocolEntity(
      node.getAttributeValue('xmlns'),
      node.getAttributeValue('id'),
      node.getAttributeValue('type'),
      node.getAttributeValue('to'),
      node.getAttributeValue('from')
    );
  }
}

module.exports = IqProtocolEntity;
