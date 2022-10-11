const CipherState = require('./CipherState');
const WASymmetricState = require('./WASymmetricState');
const HandshakeState = require('./HandshakeState');
const SwitchableHandshakeState = require('./SwitchableHandshakeState');
const IKHandshakePattern = require('./handshakepatterns/IKHandshakePattern');

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

  async login(config, serverStaticPublic) {
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
  }
}

module.exports = HandShake;
