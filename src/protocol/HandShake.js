const CipherState = require('./CipherState');
const WASymmetricState = require('./WASymmetricState');
const HandshakeState = require('./HandshakeState');
const SwitchableHandshakeState = require('./SwitchableHandshakeState');
const IKHandshakePattern = require('./handshakepatterns/IKHandshakePattern');
const { ClientHelloProto, HandShakeMessageProto } = require('../protobuf/pb');

class HandShake {
  constructor(waSocketClient) {
    this.waSocketClient = waSocketClient;

    const versionMajor = 5;
    const versionMinor = 2;
    const waversion = Buffer.from([versionMajor, versionMinor]);

    this.HEADER = Buffer.concat([Buffer.from('WA'), waversion]);
    this._prologue = Buffer.concat([Buffer.from('WA'), waversion]);

    this.EDGE_HEADER = Buffer.concat([Buffer.from('ED'), Buffer.from([0, 1])]);

    const cipherState = new CipherState('AESGCM');
    const waSymmetricState = new WASymmetricState(cipherState);
    const handshakeState = new SwitchableHandshakeState(new HandshakeState(waSymmetricState));
    this.handshakeState = handshakeState;
  }

  async start(config, serverStaticPublic) {
    let clientStaticKeypair = Buffer.from(config.client_static_keypair, 'base64');
    clientStaticKeypair = {
      private: clientStaticKeypair.slice(0, 32),
      public: clientStaticKeypair.slice(-32),
    };

    let cipherstatepair;
    if (serverStaticPublic) {
      try {
        console.debug('perform use startHandshakeIK');
        cipherstatepair = await this.startHandshakeIK(
          config,
          clientStaticKeypair,
          serverStaticPublic
        );
      } catch (e) {
        console.error('perform use startHandshakeIK error', e);
        console.debug('perform use switchHandshakeXXFallback');
        cipherstatepair = await this.switchHandshakeXXFallback(
          clientStaticKeypair,
          this.createPayload(config),
          e.serverHello
        );
      }
    } else {
      console.debug('perform use startHandshakeXX');
      cipherstatepair = await this.startHandshakeXX(config, clientStaticKeypair);
    }
    console.info('Handshake success.');
    return cipherstatepair;
  }

  async startHandshakeIK(config, clientStaticKeypair, serverStaticPublic) {
    const ik = new IKHandshakePattern();
    this.handshakeState.initialize(
      ik,
      true,
      this._prologue,
      clientStaticKeypair,
      null,
      serverStaticPublic
    );
    this.waSocketClient.write(this.EDGE_HEADER);
    this.waSocketClient.write(config.edge_routing_info || 'CAwIBQ==');
    this.waSocketClient.write(this.HEADER, false);

    const clientInfoBuffer = this.createPayload(config);

    const messageArray = [];

    this.handshakeState.write_message(clientInfoBuffer, messageArray);

    const messageBuffer = Buffer.from(messageArray);
    const ephemeral_public = messageBuffer.slice(0, 32);
    const static_public = messageBuffer.slice(32, 32 + 48);
    const payload = messageBuffer.slice(32 + 48);
    const { HandshakeMessage } = HandShakeMessageProto.HandshakeMessage;
    const clientHelloBuffer = HandshakeMessage.encode(
      HandshakeMessage.create({
        clientHello: {
          ephemeral: ephemeral_public,
          static: static_public,
          payload,
        },
      })
    ).finish();

    this.waSocketClient.send(clientHelloBuffer);

    return new Promise((resolve, reject) => {
      this.waSocketClient.once('data', async buffer => {
        const { serverHello } = HandshakeMessage.decode(buffer).toJSON();
        console.debug('serverHello', serverHello);
        if (serverHello.static && serverHello.static.length) {
          const e = new Error('');
          e.serverHello = serverHello;
          reject(e);
          return;
        }

        serverHello.static = Buffer.alloc(0);
        if (serverHello.static && serverHello.static.length) {
          serverHello.static = Buffer.from(serverHello.static, 'base64');
        }

        const message = Buffer.concat([
          Buffer.from(serverHello.ephemeral, 'base64'),
          serverHello.static,
          Buffer.from(serverHello.payload, 'base64'),
        ]);
        const cipherpair = this._handshakestate.read_message(message, []);
        [this.sendCipherState, this.recvCipherState] = cipherpair;
        // 登陆成功
        resolve(cipherpair);
      });
    });
  }

  generatePushName() {
    const strings = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const len = Math.floor(Math.random() * 4 + 4);
    let name = '';
    const stringsLen = strings.length;
    for (let i = 0; i < len; i++) {
      name += strings[Math.floor(Math.random() * stringsLen)];
    }
    return name;
  }

  createPayload(config) {
    console.debug('client version:', this.env.VERSION);
    console.debug(
      'account:',
      config.cc,
      config.phone,
      config.mcc,
      config.mnc,
      'platform',
      config.platform
    );
    console.debug('client info:', this.env.OS_VERSION, this.env.MANUFACTURER, this.env.DEVICE_NAME);
    const appVersion = this.env.VERSION.split('.');
    const clientConfig = {
      username: config.phone,
      passive: false, // 是否接收被动消息
      // passive: config.passive,
      useragent: {
        platform: config.platform || 0,
        appVersion: {
          primary: appVersion[0],
          secondary: appVersion[1],
          tertiary: appVersion[2],
          quaternary: appVersion[3],
        },
        mcc: config.mcc || '000',
        mnc: config.mnc || '000',
        osVersion: this.env.OS_VERSION,
        manufacturer: this.env.MANUFACTURER,
        device: this.env.DEVICE_NAME,
        osBuildNumber: this.env.OS_VERSION,
        phoneId: config.fdid || '',
        localeLanguageIso_639_1: config.lg || 'en',
        localeCountryIso_3166_1Alpha_2: config.lc || 'US',
        device2: 'unknown',
        // releaseChannel: 0,
      },
      pushName: config.pushName || this.generatePushName(),
      sessionId: Math.floor(Math.random() * 2 ** 32) + 1,
      shortConnect: false,
      connectType: 1,
      // dnsSource: {
      //   dnsMethod: 2,
      //   appCached: 1,
      // },
      // connectAttemptCount: 1,
      // tag23: 1,
      // tag24: 134,
    };
    if (Number(config.platform) === 10) {
      clientConfig.tag23 = 1;
      clientConfig.tag24 = 5;
    }

    const ClientConfig = ClientHelloProto.ClientHello.C2S;
    const buffer = ClientConfig.encode(ClientConfig.create(clientConfig)).finish();
    return buffer;
  }
}

module.exports = HandShake;
