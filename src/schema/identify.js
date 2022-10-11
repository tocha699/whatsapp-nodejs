module.exports = {
  mobile: {
    type: String,
    index: true,
  },
  identityKeyPair: {
    type: Object,
    set: val => {
      if (!val) return;
      if (!val.pubKey) {
        return {
          pubKey: Buffer.from(val),
          privKey: Buffer.alloc(0),
        };
      }
      return {
        pubKey: Buffer.from(val.pubKey),
        privKey: Buffer.from(val.privKey),
      };
    },
    get: val => {
      const identityKeyPair = {
        pubKey: new ArrayBuffer(val.pubKey.buffer.length),
        privKey: new ArrayBuffer(val.privKey.buffer.length),
      };
      const pubKey = new Uint8Array(identityKeyPair.pubKey);
      const privKey = new Uint8Array(identityKeyPair.privKey);
      for (let i = 0; i < val.pubKey.buffer.length; i++) {
        const item = val.pubKey.buffer[i];
        pubKey[i] = item;
      }
      for (let i = 0; i < val.privKey.buffer.length; i++) {
        const item = val.privKey.buffer[i];
        privKey[i] = item;
      }
      return identityKeyPair;
    },
  },
  registrationId: {
    type: Number,
  },
  recipientId: {
    type: String,
    index: true,
  },
  timestamp: {
    type: Number,
  },
};
