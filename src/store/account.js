const utils = require('../lib/utils');
const db = require('../db');
const { getMncByMobile } = require('../lib/mnc');

module.exports = {
  async initAccount(opts) {
    const { mobile, cc, mnc, mcc } = opts;
    let account = await db.account.findOne({ mobile });
    if (account) return account;

    let ccConfig = { cc, mnc, mcc, country: '', brand: '' };
    if (!cc || !mnc || mcc) {
      ccConfig = getMncByMobile(mobile);
    }

    const keyPair = utils.generateKeyPair();
    const data = {
      __version__: 1,
      mobile,
      ...ccConfig,

      pushName: utils.generatePushName(),
      platform: 0,
      clientStaticKeypair: Buffer.concat([keyPair.private, keyPair.public]).toString('base64'),
      serverStaticPublic: '',
      lc: 'US',
      lg: 'en',
      edgeRoutingInfo: '',
      expid: utils.generateDeviceId().toString('base64'),
      fdid: utils.generatePhoneId(),
      id: utils.generateIdentity().toString('base64'),

      sim_mcc: '000',
      sim_mnc: '000',
    };

    account = await db.account.model.findOneAndUpdate({ mobile }, data, {
      upsert: true,
      new: true,
    });
    return account;
  },
};
