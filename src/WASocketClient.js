const net = require('net');
const EventEmitter = require('events');
// const utils = require('./common/utils');
// const Decoder = require('./protocol/decoder');
// const constants = require('./config/constants');
const SocketProxy = require('./lib/SocketProxy');

class WASocketClient extends EventEmitter {
  constructor(opts, socketManager) {
    super();

    this.opts = opts;

    const { proxy, mobile, socketName, endpoint } = opts;

    this.mobile = mobile;
    this.socketName = socketName;

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
        this.console.debug('Connect whatsapp server succesed.', this.host, this.port);
        resolve();
      });
    });
  }
}

module.exports = WASocketClient;
