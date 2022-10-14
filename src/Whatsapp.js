const SocketManager = require('./SocketManager');
const db = require('./db');
const logger = require('./logger');
const libsignal = require('./lib/libsignal-protocol');
const ProtocolTreeNode = require('./packet/ProtocolTreeNode');
const utils = require('./lib/utils');

class Whatsapp {
  constructor() {
    this.socketManager = new SocketManager();

    this.id = 0;
  }

  async sendNode(node) {
    console.info('send ==>', node.toString());
    this.waSocketClient.sendEncrypt(node.toBuffer());
  }

  async sendPing() {
    //  <iq id="02" type="get" xmlns="w:p"><ping></ping></iq>
    this.pingTimer = setTimeout(() => {
      this.id++;
      const node = new ProtocolTreeNode(
        'iq',
        {
          type: 'get',
          xmlns: 'w:p',
          id: utils.generateId(this.id || 0),
        },
        [new ProtocolTreeNode('ping')]
      );
      this.sendNode(node);

      this.sendPing();
    }, 1000 * 20 + 1000 * Math.random() * 10);
  }

  async init(opts) {
    libsignal.curve = (await libsignal.default()).Curve;

    const { mobile, cc, mnc, mcc, proxy } = opts;
    await db.init();
    const account = await db.findAccount(mobile);
    if (!account) throw new Error('账户不存在');
    this.socketName = await this.socketManager.initWASocket(opts, account, this);
    this.waSocketClient = this.socketManager.getWASocketClient(this.socketName);
    this.waSocketClient.on('node', node => {
      if (node && node.tag) {
        const tag = node.tag;
        const eventName = `on${String(tag[0]).toUpperCase()}${tag.substr(1)}`;
        if (typeof this[eventName] === 'function') this[eventName](node);
        if (tag === 'success') this.waSocketClient.emit('success', node);
        if (tag === 'failure') this.waSocketClient.emit('failure', node);
      }
    });
  }

  async login() {
    try {
      await new Promise((resolve, reject) => {
        this.socketManager.startLogin(this.socketName);
        this.waSocketClient
          .once('success', () => {
            console.log('login success.');
            this.sendPing();
            resolve();
          })
          .once('failure', node => {
            const str = node.toString();
            console.log('login failed.', str);
            reject(new Error(str));
          });
      });
      return { status: 'success' };
    } catch (e) {
      return { status: 'failed', msg: e.message };
    }
  }

  async onMessage(node) {
    const participant = node.getAttr('participant');
    const isGroup = !!participant;
    if (!this.retryOnMessageIds) this.retryOnMessageIds = {};
    if (isGroup) return this.onMessageGroup(node);
    return this.onMessageContact(node);
  }

  async onMessageContact(node) {
    const tag = node.tag;
    const from = node.getAttr('from');
    const jid = from.split('@')[0];
    const type = node.getAttr('type');
    const id = node.getAttr('id');
    const json = node.toJSON();
    const t = node.getAttr('t');
    this.sendAck({ to: from, id, class: 'message', t }); // 先回包
    if (from === 'status@broadcast' || !['text', 'media'].includes(type)) {
      this.sendReceipt({ id, to: from, type: 'read' });
      this.sendAck({ to: from, id, class: 'message', t });
    }
  }

  // 接收到群消息
  async onMessageGroup(node) {
    const tag = node.tag;
    const from = node.getAttr('from');
    const participant = node.getAttr('participant');
    const notify = node.getAttr('notify'); // 对方昵称
    const type = node.getAttr('type');
    const id = node.getAttr('id');
    const t = node.getAttr('t');

    const gid = from.split('@')[0];
    const jid = participant.split('@')[0];
    const json = node.toJSON();

    this.sendAck({
      to: from,
      id,
      class: 'message',
      participant,
      t,
    });

    if (type !== 'text' && type !== 'media') {
      this.client.send(tag, { status: 'error' }, `不支持的消息类型：${type}`);
      this.sendReceipt({
        id,
        to: from,
        type: 'read',
      });
      return;
    }
    if (from === 'status@broadcast') {
      this.sendReceipt({
        id,
        to: from,
        type: 'read',
      });
    }
  }

  onNotification(node) {
    const type = node.getAttr('type');
    // 其他类型通知
    this.sendAck(
      {
        type,
        class: 'notification',
        id: node.getAttr('id'),
        to: node.getAttr('from'),
      },
      node.getAllChildren()
    );
  }

  async sendAck(attrs) {
    const node = new ProtocolTreeNode('ack', attrs);
    this.sendNode(node);
  }

  async sendReceipt(attrs) {
    const node = new ProtocolTreeNode('receipt', attrs);
    this.sendNode(node);
  }
}

module.exports = Whatsapp;
