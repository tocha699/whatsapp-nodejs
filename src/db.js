const mongoose = require('mongoose');
// const axolotl = require('./schema/axolotl');
const account = require('./schema/account');
const identify = require('./schema/identify');
const prekey = require('./schema/prekey');
const session = require('./schema/session');
const signedprekeys = require('./schema/signedprekeys');
const business = require('./schema/business');
const senderkey = require('./schema/senderkey');
const message = require('./schema/message');
const recvmessage = require('./schema/recvmessage');
const dayreport = require('./schema/dayreport');
const config = require('./config');

module.exports = {
  async init() {
    if (this.inited) return;
    this.inited = true;
    mongoose.connect(config.mongodb, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      socketTimeoutMS: 1000 * 60 * 60, // 1小时超时
      useCreateIndex: true,
    });

    this.account = mongoose.model('account', account);
    this.identify = mongoose.model('identify', identify);
    this.prekey = mongoose.model('prekey', prekey);
    this.session = mongoose.model('session', session);
    this.signedprekeys = mongoose.model('signedprekeys', signedprekeys);
    this.business = mongoose.model('business', business);
    this.senderkey = mongoose.model('senderkey', senderkey);
    this.message = mongoose.model('message', message);
    this.recvmessage = mongoose.model('recvmessage', recvmessage);

    this.dayreport = mongoose.model('dayreport', dayreport);
  },

  async findAccount(mobile) {
    const acc = await this.account.findOne({ mobile });
    return acc;
  },
};
