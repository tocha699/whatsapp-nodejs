module.exports = {
  mobile: {
    type: String,
    index: true,
  },
  keyId: {
    type: Number,
    index: true,
  },
  sent_to_server: {
    type: Boolean,
    default: false,
  },
  preKey: {
    type: Object,
    set: val => {
      const { keyPair } = val;
      return {
        ...val,
        keyPair: {
          pubKey: Buffer.from(keyPair.pubKey),
          privKey: Buffer.from(keyPair.privKey),
        },
      };
    },
    get: val => {
      const { keyPair } = val;
      const identityKeyPair = {
        pubKey: new ArrayBuffer(keyPair.pubKey.buffer.length),
        privKey: new ArrayBuffer(keyPair.privKey.buffer.length),
      };
      const pubKey = new Uint8Array(identityKeyPair.pubKey);
      const privKey = new Uint8Array(identityKeyPair.privKey);
      for (let i = 0; i < keyPair.pubKey.buffer.length; i++) {
        const item = keyPair.pubKey.buffer[i];
        pubKey[i] = item;
      }
      for (let i = 0; i < keyPair.privKey.buffer.length; i++) {
        const item = keyPair.privKey.buffer[i];
        privKey[i] = item;
      }
      return {
        ...val,
        keyPair: identityKeyPair,
      };
    },
  },
  timestamp: {
    type: Number,
  },
};
