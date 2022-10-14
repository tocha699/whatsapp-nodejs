const SocketManager = require('./SocketManager');
const db = require('./db');
const logger = require('./logger');
const libsignal = require('./lib/libsignal-protocol');

class Whatsapp {
  constructor() {
    this.socketManager = new SocketManager();
  }

  async init(opts) {
    libsignal.curve = (await libsignal.default()).Curve;

    const { mobile, cc, mnc, mcc, proxy } = opts;
    await db.init();
    const account = await db.findAccount(mobile);
    if (!account) throw new Error('账户不存在');
    this.socketName = await this.socketManager.initWASocket(opts, account);
  }

  async login() {
    await this.socketManager.startLogin(this.socketName);
  }
}

module.exports = Whatsapp;
