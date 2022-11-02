const utils = require('../lib/utils');
const ProtocolEntity = require('./ProtocolEntity');

class MessageProtocolEntity extends ProtocolEntity {
  MESSAGE_TYPE_TEXT = 'text';

  MESSAGE_TYPE_MEDIA = 'media';

  // '<message to='8616571176468-1608555499@g.us' type='text' id='BD61E1D7580F1E33F7B824E1A3941330' phash='2:Wkp/pAJc'>
  constructor(messageType, messageAttributes) {
    super('message');
    this._type = messageType;
    this.to = messageAttributes.recipient || messageAttributes.to;
    this._id =
      messageAttributes.id ||
      utils
        .hash(String(Date.now() + messageAttributes.sender + this.to + Math.random()), 'md5', 'hex')
        .toUpperCase();
    this._from = messageAttributes.sender;
    this.timestamp = messageAttributes.timestamp || this._getCurrentTimestamp();
    this.notify = messageAttributes.notify;
    this.offline = messageAttributes.offline;
    this.retry = messageAttributes.retry;
    this.participant = messageAttributes.participant;
    this.phash = messageAttributes.phash;
    this.t = messageAttributes.t;
  }

  getType() {
    return this._type;
  }

  getId() {
    return this._id;
  }

  getTimestamp() {
    return this.timestamp;
  }

  getFrom(full = true) {
    return full ? this._from : this._from.split('@')[0];
  }

  isBroadcast() {
    return false;
  }

  getTo(full = true) {
    return full ? this.to : this.to.split('@')[0];
  }

  getParticipant(full = true) {
    return full ? this.participant : this.participant.split('@')[0];
  }

  getAuthor(full = true) {
    return this.isGroupMessage() ? this.getParticipant(full) : this.getFrom(full);
  }

  getNotify() {
    return this.notify;
  }

  toProtocolTreeNode() {
    const attribs = {
      type: this._type,
      id: this._id,
    };
    if (this.participant) attribs.participant = this.participant;
    if (this.isOutgoing()) {
      attribs.to = this.to;
    } else {
      attribs.from = this._from;
      attribs.t = String(this.timestamp);
      if (typeof this.offline !== 'undefined') {
        attribs.offline = this.offline ? '1' : '0';
      }
    }
    if (this.notify) attribs.notify = this.notify;
    if (this.retry) attribs.retry = String(this.retry);
    if (this.phash) attribs.phash = this.phash;
    if (this.t) attribs.t = this.t;
    return this._createProtocolTreeNode(attribs);
  }

  isOutgoing() {
    return typeof this._from === 'undefined';
  }

  isGroupMessage() {
    if (this.isOutgoing()) {
      return this.to.match('-');
    }
    return typeof this.participant !== 'undefined';
  }

  toString() {
    let out = 'Message:\n';
    out += `ID: ${this._id}\n`;
    out += this.isOutgoing() ? `To: ${this.to}\n` : `From: ${this._from}\n`;
    out += `Type:  ${this._type}\n`;
    out += `Timestamp: ${this.timestamp}\n`;
    if (this.participant) out += `Participant: ${this.participant}\n`;
    return out;
  }
}

module.exports = MessageProtocolEntity;
