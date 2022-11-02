const IqProtocolEntity = require('./IqProtocolEntity');
const ProtocolTreeNode = require('./ProtocolTreeNode');
const config = require('../config');

class GetKeysIqProtocolEntity extends IqProtocolEntity {
  constructor(jids, reason = null) {
    super('encrypt', null, 'get', config.whatsappServer);
    this.jids = jids;
    this.reason = reason;
  }

  toProtocolTreeNode() {
    const node = super.toProtocolTreeNode();
    const keyNode = new ProtocolTreeNode('key');
    if (this.jids && this.jids.length) {
      for (let i = 0; i < this.jids.length; i++) {
        const jid = this.jids[i];
        const attrs = { jid };
        if (this.reason) {
          attrs.reason = this.reason;
        }
        const userNode = new ProtocolTreeNode('user', attrs);
        keyNode.addChild(userNode);
      }
    }
    node.addChild(keyNode);
    return node;
  }
}

module.exports = GetKeysIqProtocolEntity;
