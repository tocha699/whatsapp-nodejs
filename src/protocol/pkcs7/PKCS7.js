const PKCS7PaddingContext = require('./PKCS7PaddingContext');
const PKCS7UnpaddingContext = require('./PKCS7UnpaddingContext');

class PKCS7 {
  constructor(blockSize) {
    this.blockSize = blockSize;
  }

  padder() {
    return new PKCS7PaddingContext(this.blockSize);
  }

  unpadder() {
    return new PKCS7UnpaddingContext(this.blockSize);
  }
}

module.exports = PKCS7;
