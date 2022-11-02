const utils = require('../../lib/utils');
const db = require('../../db');

class SignalProtocolStore {
  constructor(mobile) {
    this.mobile = mobile;
    this.store = {};
    this.Direction = {
      SENDING: 1,
      RECEIVING: 2,
    };
    this.db = db;
  }

  get(key, defaultValue) {
    if (key === null || key === undefined)
      throw new Error('Tried to get value for undefined/null key');
    if (typeof this.store[key] === 'undefined') {
      return defaultValue;
    }
    return this.store[key];
  }

  async put(key, value) {
    if (key === undefined || value === undefined || key === null || value === null)
      throw new Error('Tried to store undefined/null');
    this.store[key] = value;
    await this.save();
  }

  async remove(key) {
    if (key === null || key === undefined)
      throw new Error('Tried to remove value for undefined/null key');
    delete this.store[key];
    await this.save();
  }

  async storeMessage(to, id, attrs, record) {
    await db.message.findOneAndUpdate(
      {
        mobile: this.mobile,
        to,
        id,
      },
      {
        from: this.mobile,
        attrs,
        record,
        timestamp: Date.now(),
      },
      { upsert: true }
    );
  }

  async loadMessage(to, id) {
    let doc = await db.message.findOne({ mobile: this.mobile, to, id });
    if (!doc) {
      doc = await db.message.findOne({ mobile: this.mobile, to, id: 'long' });
      if (!doc) {
        throw new Error(`Message does not exist: ${id}, to: ${to}`);
      }
    }
    return doc;
  }

  async getIdentityKeyPair() {
    const doc = await db.identify.findOne({ mobile: this.mobile, recipientId: '-1' });
    return doc ? doc.identityKeyPair : null;
  }

  async getLocalRegistrationId() {
    const doc = await db.identify.findOne({ mobile: this.mobile, recipientId: '-1' });
    this.registrationId = doc ? doc.registrationId : 0;
    return doc ? doc.registrationId : null;
  }

  async getLocalData() {
    const doc = await db.identify.findOne({ mobile: this.mobile, recipientId: '-1' });
    return doc || null;
  }

  async storeLocalData(registrationId, identityKeyPair) {
    await db.identify.findOneAndUpdate(
      { mobile: this.mobile, recipientId: '-1' },
      {
        registrationId,
        identityKeyPair,
        timestamp: Date.now(),
      },
      { upsert: true }
    );
  }

  // session
  async loadSession(address) {
    const doc = await db.session.findOne({ mobile: this.mobile, address: address.toString() });
    return doc ? doc.record : null;
  }

  async storeSession(address, record) {
    await db.session.findOneAndUpdate(
      { mobile: this.mobile, address: address.toString() },
      {
        record,
        timestamp: Date.now(),
      },
      { upsert: true }
    );
  }

  async containsSession(address) {
    const doc = await db.session.findOne({ mobile: this.mobile, address: address.toString() });
    return !!doc;
  }

  async removeSession(address) {
    await db.session.deleteOne({ mobile: this.mobile, address: address.toString() });
  }

  async removeSenderKey(groupId, jid) {
    await db.senderkey.deleteOne({ mobile: this.mobile, groupId, senderId: jid });
  }

  async removeAllSessions() {
    await db.session.remove({ mobile: this.mobile });
  }

  // signed prekey
  async loadLatestSignedPrekey() {
    const doc = await db.signedprekeys.findOne({ mobile: this.mobile }, null, {
      sort: { timestamp: -1 },
    });
    return doc ? doc.preKey : null;
  }

  async loadSignedPreKey(keyId) {
    const doc = await db.signedprekeys.findOne({ mobile: this.mobile, keyId });
    return doc ? doc.preKey.keyPair : null;
  }

  async storeSignedPreKey(keyId, preKey) {
    await db.signedprekeys.findOneAndUpdate(
      { mobile: this.mobile, keyId },
      {
        preKey,
        timestamp: Date.now(),
      },
      { upsert: true }
    );
  }

  async removeSignedPreKey(keyId) {
    await db.signedprekeys.remove({ keyId });
  }

  // prekey
  async loadUnsentPendingPreKeys() {
    const list = await db.prekey.find({
      mobile: this.mobile,
      sent_to_server: { $in: [false, undefined] },
    });
    return list;
  }

  async setAsSent(keyId) {
    await db.prekey.findOneAndUpdate({ mobile: this.mobile, keyId }, { sent_to_server: true });
  }

  async setAsSents(keyIds) {
    await db.prekey.updateMany(
      { mobile: this.mobile, keyId: { $in: keyIds } },
      { $set: { sent_to_server: true } },
      { multi: true }
    );
  }

  async loadMaxPreKeyId() {
    const doc = await db.prekey.findOne({ mobile: this.mobile }, null, { sort: { keyId: -1 } });
    return doc ? doc.keyId : 0;
  }

  async loadPreKeys() {
    const list = await db.prekey.find({ mobile: this.mobile });
    return list;
  }

  async loadPreKey(keyId) {
    const doc = await db.prekey.findOne({ mobile: this.mobile, keyId });
    return doc ? doc.preKey.keyPair : null;
  }

  async storePreKey(keyId, preKey) {
    await db.prekey.findOneAndUpdate(
      { mobile: this.mobile, keyId },
      {
        preKey,
        timestamp: Date.now(),
      },
      { upsert: true }
    );
  }

  async storePreKeys(preKeys) {
    if (!preKeys || preKeys.length === 0) return;
    const t = Date.now();
    const records = preKeys.map(preKey => {
      return {
        mobile: this.mobile,
        keyId: preKey.keyId,
        preKey: preKey.preKey,
        timestamp: t,
      };
    });
    await db.prekey.insertMany(records);
  }

  async containsPreKey(keyId) {
    const doc = await db.prekey.findOne({ mobile: this.mobile, keyId });
    return !!doc;
  }

  async removePreKey(keyId) {
    await db.prekey.deleteOne({ keyId });
  }

  // identity
  async loadIdentityKey(recipientId) {
    if (recipientId === null || recipientId === undefined)
      throw new Error('Tried to get identity key for undefined/null key');
    const doc = await db.identify.findOne({ mobile: this.mobile, recipientId });
    return doc ? doc.identityKeyPair.pubKey : null;
  }

  async saveIdentity(recipientId, identityKeyPair) {
    const identity = await this.loadIdentityKey(recipientId);
    await db.identify.findOneAndUpdate(
      { mobile: this.mobile, recipientId },
      {
        identityKeyPair,
        timestamp: Date.now(),
      },
      { upsert: true, new: true }
    );
    if (identity && utils.toString(identity) !== utils.toString(identityKeyPair)) {
      return true;
    }
    return false;
  }

  async storeSenderKey(senderKeyName, serialized) {
    await db.senderkey.findOneAndUpdate(
      {
        mobile: this.mobile,
        groupId: senderKeyName.getGroupId(),
        senderId: senderKeyName
          .getSender()
          .getName()
          .split(['@'])[0],
      },
      {
        record: JSON.stringify(serialized),
      },
      {
        upsert: true,
      }
    );
  }

  async loadSenderKey(senderKeyName) {
    const doc = await db.senderkey.findOne({
      mobile: this.mobile,
      groupId: senderKeyName.getGroupId(),
      senderId: senderKeyName
        .getSender()
        .getName()
        .split(['@'])[0],
    });
    if (!doc) return null;
    return JSON.parse(doc.record);
  }

  async isTrustedIdentity(identifier, identityKey) {
    // identityKey.shift();
    return true;
    // if (identifier === null || identifier === undefined) {
    //   throw new Error('tried to check identity key for undefined/null key');
    // }
    // const doc = await this.loadIdentityKey(identifier);
    // if (!doc) return true;
    // return util.toString(identityKey) === util.toString(doc.identityKeyPair);
  }
}

module.exports = SignalProtocolStore;
