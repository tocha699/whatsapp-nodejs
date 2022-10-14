const SocketManager = require('./SocketManager');
const db = require('./db');
const ProtocolTreeNode = require('./packet/ProtocolTreeNode');
const utils = require('./lib/utils');
const config = require('./config');
const initBeforeStart = require('./initBeforeStart');

class Whatsapp {
  constructor(opts = {}) {
    this.socketManager = new SocketManager();

    Object.assign(config, opts);

    this.id = 0;
    this.isLogin = false;
  }

  async sendNode(node) {
    this.waSocketClient.sendNode(node);
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
    await initBeforeStart();

    const { mobile, cc, mnc, mcc, proxy } = opts;
    const account = await db.findAccount(mobile);
    if (!account) throw new Error('账户不存在');
    this.socketName = await this.socketManager.initWASocket(opts, account);
    this.waSocketClient = this.socketManager.getWASocketClient(this.socketName);
    this.waSocketClient.on('node', node => {
      if (node && node.tag) {
        const tag = node.tag;
        const eventName = `on${String(tag[0]).toUpperCase()}${tag.substr(1)}`;
        if (typeof this[eventName] === 'function') this[eventName](node);
        // 特殊包特殊处理
        if (['success', 'failure'].includes(tag)) {
          this.waSocketClient.emit(tag, node);
        }
      }
    });
    this.waSocketClient.on('destroy', () => {
      if (this.pingTimer) {
        clearTimeout(this.pingTimer);
        this.pingTimer = null;
      }
    });
  }

  async login() {
    try {
      await new Promise((resolve, reject) => {
        this.waSocketClient.login();
        this.waSocketClient.once('success', () => {
          console.log('Login success.');
          this.sendPing();
          resolve();
        });
        this.waSocketClient.once('failure', node => {
          const str = node.toString();
          console.log('Login failed.', str);
          reject(new Error(str));
        });
      });
      this.isLogin = true;
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
