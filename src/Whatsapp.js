const initBeforeStart = require('./initBeforeStart');
const utils = require('./lib/utils');
const WARequest = require('./lib/WARequest');

const libsignal = require('./lib/libsignal');

const SocketManager = require('./SocketManager');
const db = require('./db');
const ProtocolTreeNode = require('./packet/ProtocolTreeNode');
const config = require('./config');
const accountStore = require('./store/account');
const Signal = require('./protocol/signal');

const Message = require('./protobuf/pb').Message.Message;

const GetKeysIqProtocolEntity = require('./packet/GetKeysIqProtocolEntity');
const ResultGetKeysIqProtocolEntity = require('./packet/ResultGetKeysIqProtocolEntity');
const EncProtocolEntity = require('./packet/EncProtocolEntity');
const EncryptedMessageProtocolEntity = require('./packet/EncryptedMessageProtocolEntity');

const { SignalProtocolAddress } = libsignal;
class Whatsapp {
  constructor(opts = {}) {
    this.socketManager = new SocketManager();

    Object.assign(config, opts);

    this.id = 0;
    this.isLogin = false;
    this.mobile = '';
    this.cc = '';
    this.mnc = '';
    this.mcc = '';
    this.proxy = '';
  }

  async init(opts) {
    await initBeforeStart();

    const { mobile, cc, mnc, mcc, proxy } = opts;
    this.opts = opts;

    this.mobile = mobile;
    this.proxy = proxy;
    this.cc = cc;
    this.mnc = mnc;
    this.mcc = mcc;
    this.proxy = proxy;

    this.signal = new Signal(this.mobile);
    await this.signal.init();
  }

  // get sms code
  async sms() {
    const account = await accountStore.initAccount(this.opts);

    const request = new WARequest(this.signal, config, account);
    await request.init();
    if (this.proxy) request.setProxy(this.proxy);
    request.url = 'https://v.whatsapp.net/v2/code?ENC=';
    request.addParam('client_metrics', '{"attempts"%3A1}');
    request.addParam('read_phone_permission_granted', '1');
    request.addParam('offline_ab', '{"exposure"%3A[]%2C"metrics"%3A{}}');
    request.addParam('network_operator_name', '');
    request.addParam('sim_operator_name', '');
    request.addParam('sim_state', '1');

    request.addParam('mcc', utils.fillZero(account.mcc, 3));
    request.addParam('mnc', utils.fillZero(account.mnc, 3));
    request.addParam('sim_mcc', utils.fillZero(account.sim_mcc, 3));
    request.addParam('sim_mnc', utils.fillZero(account.sim_mnc, 3));
    request.addParam('method', 'sms');
    request.addParam('reason', '');
    request.addParam('token', config.getToken(request._p_in));
    request.addParam('hasav', '2');
    request.addParam('id', Buffer.from(account.id, 'base64'));
    request.addParam(
      'backup_token',
      Buffer.from(account.id, 'base64')
        .slice(0, 15)
        .toString('base64')
    );
    let response;
    try {
      response = await request.get();
      console.info('get sms code===>', response);
    } catch (e) {
      console.info(`get sms code failed: ${e.message}`);
      console.log(e.stack);
      throw new Error(e);
    }
    if (response.status === 'ok' || response.status === 'sent') {
      return { status: 'success', data: response };
    }
    return { status: 'error', data: response };
  }

  // use sms code to register
  async register(params) {
    const account = await accountStore.initAccount(this.opts);

    const { code } = params;
    const request = new WARequest(this.signal, config, account);
    await request.init();
    if (this.proxy) request.setProxy(this.proxy);
    request.url = 'https://v.whatsapp.net/v2/register?ENC=';

    request.addParam('client_metrics', '{"attempts"%3A1}');
    request.addParam('entered', '1');
    request.addParam('sim_operator_name', '');
    request.addParam('id', Buffer.from(account.id, 'base64'));
    request.addParam(
      'backup_token',
      Buffer.from(account.id, 'base64')
        .slice(0, 15)
        .toString('base64')
    );
    request.addParam(
      'code',
      String(code)
        .trim()
        .replace('-', '')
    );
    let response;
    try {
      response = await request.get();
      console.info('use code to register ===>', response);
    } catch (e) {
      console.error(`use code to register failed`, e);
      throw new Error(e);
    }
    // {
    //   autoconf_type: 1,
    //   login: '34611093620',
    //   security_code_set: false,
    //   status: 'ok',
    //   type: 'new'
    // }
    if (response.status === 'ok') {
      return { status: 'success', data: response };
    }
    return { status: 'error', data: response };
  }

  async login() {
    try {
      const account = await db.findAccount(this.mobile);
      if (!account) throw new Error('The account does not exist, please check the database');
      account.version = config.version;
      this.socketName = await this.socketManager.initWASocket(this.opts, account);
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

  async assertLogin() {
    if (!this.isLogin) throw new Error('need login');
  }

  async sendContactTextMessage(params) {
    const { jid, message } = params;
    await this.assertLogin();

    const messageBuffer = Message.encode(
      Message.create({
        conversation: message,
      })
    ).finish();
    // check session
    const isExists = await this.signal.session_exists(jid);
    if (!isExists) await this.getKeys([jid]);
    // create node
    const encryptData = await this.signal.encrypt(jid, messageBuffer);
    const msgType = encryptData.type === 1 ? 'msg' : 'pkmsg';
    const encNode = new EncProtocolEntity(msgType, 2, Buffer.from(encryptData.body));
    const messageNode = new EncryptedMessageProtocolEntity([encNode], 'text', {
      recipient: utils.normalize(jid),
    }).toProtocolTreeNode();

    const node = await this.sendNode(messageNode);
    // save to db for retry
    await this.signal.storeMessage(
      jid,
      messageNode.getAttr('id'),
      messageNode.attributes,
      messageBuffer.toString('base64')
    );
    return node.toJSON();
  }

  async getKeys(recipientIds) {
    const getJidNode = new GetKeysIqProtocolEntity(
      recipientIds.map(recipientId => {
        return utils.normalize(recipientId);
      })
    ).toProtocolTreeNode();
    const node = await this.sendNode(getJidNode);
    if (node.getAttributeValue('type') === 'error')
      throw new Error(node.toJSON().children[0].props.text);
    const entity = ResultGetKeysIqProtocolEntity.fromProtocolTreeNode(node);
    const resultJids = entity.getJids();
    for (let i = 0; i < resultJids.length; i++) {
      const jid = resultJids[i];
      const recipient_id = jid.split('@')[0];
      const preKeyBundle = entity.getPreKeyBundleFor(jid);
      await this.signal.create_session(new SignalProtocolAddress(recipient_id, 1), preKeyBundle);
    }
    return node;
  }

  onReceipt(node) {
    const participant = node.getAttr('participant');
    if (participant) {
      return this.onGroupReceipt(node);
    }
    return this.onContactReceipt(node);
  }

  onGroupReceipt(node) {
    const type = node.getAttr('type');
    const from = node.getAttr('from');
    const participant = node.getAttr('participant');
    const id = node.getAttr('id');
    const t = node.getAttr('t');
    const offline = node.getAttr('offline');
    const className = node.getAttr('class');
    if (!type) {
      const o = {
        to: from,
        id,
        participant,
        class: 'receipt',
      };
      if (className) o.class = className;
      if (t) o.t = t;
      if (offline) o.offline = String(offline);
      this.sendAck(o);
      return;
    }
    if (type === 'read') {
      const o = {
        to: from,
        id,
        type,
        participant,
        class: 'receipt',
      };
      if (className) o.class = className;
      if (t) o.t = t;
      if (offline) o.offline = String(offline);
      this.sendAck(o);
      return;
    }
    if (type === 'retry') {
      const o = {
        to: from,
        type: 'retry',
        id,
        participant,
        class: 'receipt',
      };
      this.sendAck(o);
      // this.retrySendGroupMessage(from.split('@')[0], participant.split('@')[0], id);
      return;
    }
    const o = {
      type,
      to: from,
      class: 'receipt',
    };
    if (className) o.class = className;
    if (t) o.t = t;
    if (offline) o.offline = String(offline);
    this.sendAck(o);
  }

  onContactReceipt(node) {
    const type = node.getAttr('type');
    const from = node.getAttr('from');
    const jid = from.split('@')[0];
    const id = node.getAttr('id');
    const t = node.getAttr('t');
    const offline = node.getAttr('offline');
    const className = node.getAttr('class');
    if (!type) {
      if (jid.match('-')) {
        this.sendAck({
          to: from,
          id,
          class: 'receipt',
        });
        return;
      }
      // 收到消息
      const o = {
        to: from,
        id,
        class: 'receipt',
      };
      if (className) o.class = className;
      this.sendAck(o);
      return;
    }
    if (type === 'read') {
      const o = {
        to: from,
        id,
        type,
        class: 'receipt',
      };
      if (className) o.class = className;
      this.sendAck(o);
      // this.sendSimpleNode(node);
      return;
    }
    if (type === 'retry') {
      const o = {
        to: from,
        type: 'retry',
        id,
        class: 'receipt',
      };
      this.sendAck(o);
      // this.retrySendContactMessage(jid, id);
      return;
    }
    const o = {
      type,
      to: from,
      class: 'receipt',
    };
    if (className) o.class = className;
    if (t) o.t = t;
    if (offline) o.offline = String(offline);
    this.sendAck(o);
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
    const notify = node.getAttr('notify'); // pushName
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
      this.client.send(tag, { status: 'error' }, `not support message type ：${type}`);
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

  onNotificationPsa(node) {
    this.sendAck({
      id: node.getAttr('id'),
      class: 'notification',
      type: 'psa',
      to: node.getAttr('from'),
      participant: node.getAttr('participant'),
      t: node.getAttr('t'),
    });
  }

  onNotificationEncrypt(node) {
    this.sendAck({
      type: 'encrypt',
      class: 'notification',
      id: node.getAttr('id'),
      to: node.getAttr('from'),
      t: node.getAttr('t'),
    });
  }

  onNotificationGroup(node) {
    this.sendAck({
      type: 'w:gp2',
      id: node.getAttr('id'),
      to: node.getAttr('from'),
      class: 'notification',
      participant: node.getAttr('participant'),
    });
  }

  onNotification(node) {
    const type = node.getAttr('type');
    if (type === 'psa') return this.onNotificationPsa(node);
    if (type === 'encrypt') return this.onNotificationEncrypt(node);
    if (type === 'w:gp2') return this.onNotificationGroup(node); //
    // other type
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

  async sendAck(attrs) {
    const node = new ProtocolTreeNode('ack', attrs);
    this.sendNode(node);
  }

  async sendReceipt(attrs) {
    const node = new ProtocolTreeNode('receipt', attrs);
    this.sendNode(node);
  }

  async sendNode(node) {
    return await this.waSocketClient.sendNode(node);
  }
}

module.exports = Whatsapp;
