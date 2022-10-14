const net = require('net');
const EventEmitter = require('events');
const SocketProxy = require('./lib/SocketProxy');
const HandShake = require('./protocol/HandShake');

class WASocketClient extends EventEmitter {
  constructor(opts, socketManager) {
    super();

    this.opts = opts;

    const { proxy, mobile, socketName, endpoint, account, whatsapp } = opts;

    this.mobile = mobile;
    this.socketName = socketName;
    this.account = account;
    this.whatsapp = whatsapp;

    const { port, host } = endpoint;
    this.port = port;
    this.host = host;

    // format proxy
    this.proxy = null;
    if (proxy && proxy.host) {
      this.proxy = {
        host: proxy.host || 'localhost',
        port: proxy.port || 1080,
        username: proxy.userId || proxy.username || '',
        password: proxy.password || '',
        type: proxy.type || 'socks5',
      };
    }

    this.socketManager = socketManager;

    this.console = console.child({ socketName, mobile });

    // 状态标识
    this.inited = false;
    this.destroyed = false;

    // 缓冲区
    this.recv = Buffer.alloc(0);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;

    this.socket.destroy();
    this.socket = null;

    this.console = null;
    this.socketManager = null;

    this.emit('destroy', this.socketName);
  }

  async init() {
    if (this.inited) return;
    this.inited = true;
    this.console.debug('Start connect whatsapp server.', this.host, this.port);

    if (this.proxy) {
      this.socket = new SocketProxy({ proxy: this.proxy });
      this.console.debug('Use proxy', this.proxy);
    } else {
      this.socket = new net.Socket();
    }

    this.socket.setKeepAlive(true);

    this.socket.on('data', async data => {
      if (this.destroyed) return;
      this.recv = Buffer.concat([this.recv, data]);
      try {
        this.parseData();
      } catch (e) {
        this.console.error(`Parse data error`, e);
      }
    });

    this.socket.on('error', e => {
      if (this.destroyed) return;
      this.console.error('wa socket client on error.', e);
      this.socket.destroy();
    });
    this.socket.on('timeout', () => {
      if (this.destroyed) return;
      this.console.debug('wa socket client timeout.');
      this.socket.destroy();
    });
    // close 可能会触发两次，so 只处理一次即可。
    this.socket.once('close', () => {
      if (this.destroyed) return;
      this.console.debug('wa socket client closed.');
      this.destroy();
    });

    const options = {
      port: this.port,
      host: this.host,
      timeout: 1000 * 10,
    };
    await new Promise((resolve, reject) => {
      this.socket.connect(options, async () => {
        if (this.destroyed) return reject(new Error('WA socket has destroyed.'));
        this.console.debug('Connect whatsapp server succesed.', this.host, this.port);
        resolve();
      });
    });
  }

  async parseData() {
    if (this.destroyed) return;
    // 前三个字节标识包体长度
    if (this.recv.length < 3) return;
    const len = Number(`0x${this.recv.slice(0, 3).toString('hex')}`);
    if (this.recv.length < len + 3) return;
    const recv = this.recv.slice(3, len + 3);
    this.recv = this.recv.slice(len + 3);

    this.emit('data', recv);
    this.len = 0;
    this.parseData();
  }

  generateHeader(num, len = 6) {
    let str = Number(num).toString(16);
    str = new Array(len - str.length + 1).join('0') + str;
    return Buffer.from(str, 'hex');
  }

  write(buffer) {
    if (this.destroyed) return;
    this.socket.write(buffer);
  }

  async sendEncrypt(message) {
    // TODO
    this.emit('sendencryptmessage', message);
  }

  async send(message, header = true) {
    try {
      let buffer = null;
      if (typeof message === 'string') {
        buffer = Buffer.from(message, 'base64');
      } else {
        buffer = Buffer.from(message);
      }
      if (header) this.write(this.generateHeader(buffer.length));
      this.write(buffer);
    } catch (e) {
      this.logger.error('发送数据失败', e);
    }
  }

  async login() {
    if (this.loginStatus === '登陆中') return;
    if (this.loginStatus === '已登陆') return;
    const handShake = new HandShake(this);
    await handShake.login();
    // 登陆成功
    this.emit('login');
  }
}

module.exports = WASocketClient;
