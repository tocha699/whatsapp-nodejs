const { byteUnpaddingUpdate, byteUnpaddingCheck } = require('./PKCS7Util');

class PKCS7UnpaddingContext {
  constructor(blockSize) {
    this.blockSize = blockSize;
    this._buffer = Buffer.alloc(0);
  }

  update(data) {
    const [buffer, result] = byteUnpaddingUpdate(this._buffer, data, this.blockSize);
    this._buffer = buffer;
    return result;
  }

  finalize() {
    const result = byteUnpaddingCheck(this._buffer);
    this._buffer = Buffer.alloc(0);
    return result;
  }
}

module.exports = PKCS7UnpaddingContext;
