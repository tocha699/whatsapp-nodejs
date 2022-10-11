const crypto = require('crypto');
const EventEmitter = require('events');

class SocketClient extends EventEmitter {
  constructor(opts, socketManager) {
    super();

    this.opts = opts;

    const { socket, socketName, isUseBufferLength } = opts;

    this.socketName = socketName;
    this.socket = socket; // 客户端的 socket 连接
    this.socketManager = socketManager; // socketManager

    this.isUseBufferLength = isUseBufferLength;
    this.console = console.child({ socketName });

    // 状态标识
    this.inited = false; // 是否初始化
    this.destroyed = false; // 是否被销毁
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

  // 初始化客户端socket实例
  async init() {
    if (this.inited) return;
    this.inited = true;

    this.console.debug('客户端建立连接，处理客户端 socket 事件');

    let len = 0;
    let chunks = '';
    const reg = /len"?:\s?(\d{7})/;

    this.socket.on('data', data => {
      if (this.destroyed) return;
      const tmpStr = data.toString('utf8');
      chunks += tmpStr;
      if (!len && reg.test(chunks)) {
        len = Number(chunks.match(reg)[1] - 1000000); // 获取 json 包体长度
      }
      if (!len) return;
      this.console.debug('接收到客户端数据，长度：', len);
      // 支持计算流长度或字符串长度
      let recvLen = 0;
      let text = '';
      const buffer = Buffer.from(chunks);
      if (this.isUseBufferLength) {
        recvLen = buffer.length;
        if (recvLen < len) return; // 包没有接收完全，继续等待
        text = buffer.slice(0, len).toString(); // 截取 json 包体
        chunks = buffer.slice(len).toString(); // 清空 len 长度的缓存
      } else {
        recvLen = chunks.length;
        if (recvLen < len) return; // 包没有接收完全，继续等待
        text = chunks.substr(0, len); // 截取 json 包体
        chunks = chunks.substr(len); // 清空 len 长度的缓存
      }
      len = 0;
      this.onData(text);
    });
    this.socket.on('error', e => {
      if (this.destroyed) return;
      this.console.error('socket client on error', e);
      this.socket.destroy();
    });
    this.socket.on('timeout', () => {
      if (this.destroyed) return;
      this.console.debug('socket client timeout.');
      this.socket.destroy();
    });
    // close 可能会触发两次，so 只处理一次即可。
    this.socket.once('close', () => {
      if (this.destroyed) return;
      this.console.debug(`socket client closed.`);
      this.destroy();
    });
  }

  async onData(plainText) {
    this.console.debug('接收到客户端请求====>', plainText);
    // 解析第一层数据
    /**
     * uid 字符串系统分配的商户 ID
     * timestamp 数字，当前时间，单位ms
     * reqId 字符串，请求唯一id，用于区分不同请求，服务端响应时会携带该 id
     * len 包体长度，固定 7 位整数，数字范围：1000000 - 9999999。
     * data 传输的数据
     * * data.cmd 接口名称
     * * data.params json 对象，请求参数
     */
    let json = null;
    try {
      json = JSON.parse(plainText || '');
    } catch (e) {
      this.console.error('解析客户端数据失败', plainText, e);
      return this.sendError('ParseError', '解析 json 失败');
    }
    const { uid, timestamp, data, reqId } = json;
    // 校验参数
    if (!uid) {
      this.sendError('ParseError', 'uid 必传', reqId);
    }
    if (!timestamp) {
      return this.sendError('ParseError', 'timestamp 必传', reqId);
    }
    if (!reqId) {
      return this.sendError('ParseError', 'reqId 必传', reqId);
    }
    // 时间误差 1 小时
    if (Math.abs(Date.now() - timestamp) > 1000 * 60 * 60 * 1) {
      return this.sendError('ParseError', 'timestamp 错误，请检查本地时间设置', reqId);
    }

    // 获取商户信息及 AESKEY
    this.uid = this.uid || uid;
    this.aesKey = await this.socketManager.getClientAESKeyByUID(this.uid);
    if (!this.aesKey) {
      return this.sendError('ParseError', 'uid 或 aesKey 不存在', reqId);
    }

    // 解析第二层数据
    let decryptText = '';
    let decryptJson = null;
    try {
      decryptText = this.decrypAES(data, this.aesKey); // 解密 data
    } catch (e) {
      this.console.error('解析数据失败', reqId, data, this.aesKey, e);
      return this.sendError('ParseError', '解密数据失败', reqId);
    }
    try {
      decryptJson = JSON.parse(decryptText || '');
    } catch (e) {
      this.console.error('解析客户端数据失败', reqId, decryptText, e);
      return this.sendError('ParseError', '解码参数 json 数据失败', reqId);
    }

    // 处理客户端请求
    const { cmd, params = {} } = decryptJson;
    this.console.debug('处理客户端请求', reqId, cmd, params);

    try {
      const res = await this.socketManager.exec(this.socketName, cmd, params);
      return this.send(cmd, res, '', reqId);
    } catch (e) {
      // 上面异步处理消息，可能没处理完的时候，socket 断开了，所以需要判断
      if (this.destroyed) return;
      this.console.error(`处理请求失败`, reqId, cmd, params, e);
      return this.sendError(cmd, `处理请求失败：${e ? e.message : '未知错误'}`, reqId);
    }
  }

  sendError(cmd, errMsg, reqId) {
    this.send(cmd, { status: 'error', errMsg }, errMsg, reqId);
  }

  sendSuccess(cmd, params = {}, reqId) {
    if (Object.keys(params).length === 0) {
      params = { status: 'success' };
    }
    this.send(cmd, params, '', reqId);
  }

  send(cmd = '', params = {}, errMsg = '', reqId) {
    if (this.destroyed) return;

    if (Object.keys(params).length === 0) {
      params = { status: 'success' };
    }

    const data = JSON.stringify({ cmd, params });

    let res = {
      uid: this.uid,
      timestamp: Date.now(),
      reqId,
      errMsg,
      data: this.encrypAES(data, this.aesKey),
      len: 1000000,
      retCode: errMsg ? -1 : 0,
    };
    const jsonString = JSON.stringify(res);

    if (this.isUseBufferLength) {
      res.len += Buffer.from(jsonString).length; // 计算字节流长度
    } else {
      res.len += jsonString.length; // 计算utf8编码字符串长度
    }
    res = JSON.stringify(res);
    this.console.debug(`发送到客户端====>`, reqId, data);
    try {
      this.socket.write(res);
    } catch (e) {
      this.console.error('发送数据到客户端失败', res, e);
    }
  }

  // aes 加密
  encrypAES(data, key) {
    const iv = Buffer.alloc(0);
    const clearEncoding = 'utf8';
    const cipherEncoding = 'base64';
    const cipherChunks = [];
    const cipher = crypto.createCipheriv('aes-128-ecb', Buffer.from(key, 'base64'), iv);
    cipher.setAutoPadding(true);

    cipherChunks.push(cipher.update(data, clearEncoding));
    cipherChunks.push(cipher.final());

    return Buffer.concat(cipherChunks).toString(cipherEncoding);
  }

  // aes 解密
  decrypAES(data, key) {
    const iv = Buffer.alloc(0);
    const clearEncoding = 'utf8';
    const cipherEncoding = 'base64';
    const cipherChunks = [];
    const decipher = crypto.createDecipheriv('aes-128-ecb', Buffer.from(key, 'base64'), iv);
    decipher.setAutoPadding(true);

    cipherChunks.push(decipher.update(data, cipherEncoding, clearEncoding));
    cipherChunks.push(decipher.final(clearEncoding));

    return cipherChunks.join('');
  }
}
module.exports = SocketClient;
