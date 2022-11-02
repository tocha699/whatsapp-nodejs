const utils = require('../lib/utils');
const ProtocolEntity = require('./ProtocolEntity');
const ProtocolTreeNode = require('./ProtocolTreeNode');

class EncProtocolEntity extends ProtocolEntity {
  TYPE_PKMSG = 'pkmsg';

  TYPE_MSG = 'msg';

  TYPE_SKMSG = 'skmsg';

  constructor(type, version, data, mediaType = null, jid = null) {
    super('enc');
    this.type = type;
    this.version = Number(version);
    this.data = data;
    this.mediaType = mediaType;
    this.jid = jid;
  }

  getType() {
    return this.type;
  }

  getVersion() {
    return this.version;
  }

  getData() {
    return this.data;
  }

  getMediaType() {
    return this.mediaType;
  }

  getJid() {
    return this.jid;
  }

  toProtocolTreeNode() {
    const attribs = { type: this.type, v: String(this.version) };
    if (this.mediaType) {
      attribs.mediatype = this.mediaType;
    }
    const encNode = new ProtocolTreeNode('enc', attribs, null, this.data);
    if (this.jid) {
      return new ProtocolTreeNode('to', { jid: utils.normalize(this.jid) }, [encNode]);
    }
    return encNode;
  }
}

module.exports = EncProtocolEntity;
