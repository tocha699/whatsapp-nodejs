const { bytePaddingUpdate, bytePaddingPad } = require('./PKCS7Util');

class PKCS7PaddingContext {
  constructor(blockSize) {
    this.blockSize = blockSize;
    this._buffer = Buffer.alloc(0);
  }

  update(data) {
    const [buffer, result] = bytePaddingUpdate(this._buffer, data, this.blockSize);
    this._buffer = buffer;
    return result;
  }

  padding(size) {
    return Buffer.alloc(size).fill(size);
  }

  finalize() {
    const result = bytePaddingPad(this._buffer, this.blockSize, this.padding);
    this._buffer = Buffer.alloc(0);
    return result;
  }
}

module.exports = PKCS7PaddingContext;
