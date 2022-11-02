const ResultIqProtocolEntity = require('./ResultIqProtocolEntity');
const ProtocolTreeNode = require('./ProtocolTreeNode');
const utils = require('../lib/utils');
const config = require('../config');

class ResultGetKeysIqProtocolEntity extends ResultIqProtocolEntity {
  /**
   * <iq type="result" from="s.whatsapp.net" id="3">
    <list>
    <user jid="79049347231@s.whatsapp.net">
    <registration>
        HEX:7a9cec4b</registration>
    <type>

    HEX:05</type>
    <identity>
    HEX:eeb668c8d062c99b43560c811acfe6e492798b496767eb060d99e011d3862369</identity>
    <skey>
    <id>

    HEX:000000</id>
    <value>
    HEX:a1b5216ce4678143fb20aaaa2711a8c2b647230164b79414f0550b4e611ccd6c</value>
    <signature>
    HEX:94c231327fcd664b34603838b5e9ba926718d71c206e92b2b400f5cf4ae7bf17d83557bf328c1be6d51efdbd731a26d000adb8f38f140b1ea2a5fd3df2688085</signature>
        </skey>
    <key>
        <id>
        HEX:36b545</id>
    <value>
    HEX:c20826f622bec24b349ced38f1854bdec89ba098ef4c06b2402800d33e9aff61</value>
    </key>
    </user>
    </list>
    </iq>
   */

  constructor(_id, preKeyBundleMap = null) {
    super(config.WHATSAPP_SERVER, _id);
    this.setPreKeyBundleMap(preKeyBundleMap);
  }

  getJids() {
    return Object.keys(this.preKeyBundleMap);
  }

  setPreKeyBundleMap(preKeyBundleMap = null) {
    this.preKeyBundleMap = preKeyBundleMap || {};
  }

  setPreKeyBundleFor(jid, preKeyBundle) {
    this.preKeyBundleMap[jid] = preKeyBundle;
  }

  getPreKeyBundleFor(jid) {
    return this.preKeyBundleMap[jid];
  }

  _intToBytes(val) {
    return utils.generateHeader(val, 4);
  }

  _bytesToInt(val) {
    return Number(`0x${val.toString('hex')}`);
  }

  encStr(str) {
    return str;
  }

  static fromProtocolTreeNode(node) {
    const entity = new ResultGetKeysIqProtocolEntity(node.getAttributeValue('id'));
    const userNodes = node.getChild('list').getAllChildren();
    for (let i = 0; i < userNodes.length; i++) {
      const userNode = userNodes[i];
      const preKeyNode = userNode.getChild('key');
      const signedPreKeyNode = userNode.getChild('hash');
      const registrationId = userNode.getChild('registration').getData();
      const identityKey = userNode.getChild('identity').getData();

      const preKeyId = preKeyNode ? preKeyNode.getChild('id').getData() : '';
      const preKeyPublic = preKeyNode ? preKeyNode.getChild('value').getData() : '';

      const signedPreKeyId = signedPreKeyNode.getChild('id').getData();
      const signedPreKeySig = signedPreKeyNode.getChild('signature').getData();
      const signedPreKeyPub = signedPreKeyNode.getChild('value').getData();

      const jid = userNode.getAttributeValue('jid');
      const preKeyBundle = {
        encodedNumber: `${jid.split('@')[0]}.1`,
        identityKey: Buffer.concat([Buffer.from([5]), Buffer.from(identityKey)]),
        registrationId: Number(`0x${Buffer.from(registrationId).toString('hex')}`),

        signedPreKey: {
          keyId: Number(`0x${Buffer.from(signedPreKeyId).toString('hex')}`),
          publicKey: Buffer.concat([Buffer.from([5]), Buffer.from(signedPreKeyPub)]),
          signature: Buffer.from(signedPreKeySig),
        },
      };
      if (preKeyNode) {
        preKeyBundle.preKey = {
          keyId: Number(`0x${Buffer.from(preKeyId).toString('hex')}`),
          publicKey: Buffer.concat([Buffer.from([5]), Buffer.from(preKeyPublic)]),
        };
      }
      entity.setPreKeyBundleFor(jid, preKeyBundle);
    }
    return entity;
  }

  toProtocolTreeNode() {
    const node = super.toProtocolTreeNode();
    const listNode = new ProtocolTreeNode('list');
    node.addChild(listNode);
    const keys = Object.keys(this.preKeyBundleMap);
    for (let i = 0; i < keys.length; i++) {
      const jid = keys[i];
      const preKeyBundle = this.preKeyBundleMap[jid];
      const userNode = new ProtocolTreeNode('user', { jid });
      const registrationNode = new ProtocolTreeNode(
        'registration',
        null,
        null,
        this._intToBytes(preKeyBundle.getRegistrationId())
      );
      const typeNode = new ProtocolTreeNode('type', null, null, this._intToBytes(5));
      const identityNode = new ProtocolTreeNode(
        'identity',
        null,
        null,
        preKeyBundle
          .getIdentityKey()
          .getPublicKey()
          .getPublicKey()
      );
      const skeyNode = new ProtocolTreeNode('skey');
      const skeyNode_idNode = new ProtocolTreeNode(
        'id',
        null,
        null,
        this._intToBytes(preKeyBundle.getSignedPreKeyId())
      );
      const skeyNode_valueNode = new ProtocolTreeNode(
        'value',
        null,
        null,
        preKeyBundle.getSignedPreKey().getPublicKey()
      );
      const skeyNode_signatureNode = new ProtocolTreeNode(
        'signature',
        null,
        null,
        preKeyBundle.getSignedPreKeySignature()
      );
      skeyNode.addChildren([skeyNode_idNode, skeyNode_valueNode, skeyNode_signatureNode]);

      const preKeyNode = new ProtocolTreeNode('key');
      const preKeyNode_idNode = new ProtocolTreeNode(
        'id',
        null,
        null,
        this._intToBytes(preKeyBundle.getPreKeyId())
      );
      const preKeyNode_valueNode = new ProtocolTreeNode(
        'value',
        null,
        null,
        preKeyBundle.getPreKey().getPublicKey()
      );
      preKeyNode.addChildren([preKeyNode_idNode, preKeyNode_valueNode]);

      userNode.addChildren([registrationNode, typeNode, identityNode, skeyNode, preKeyNode]);
      listNode.addChild(userNode);
    }
    return node;
  }
}

module.exports = ResultGetKeysIqProtocolEntity;
