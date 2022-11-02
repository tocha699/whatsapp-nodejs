const bytePaddingUpdate = (buffer, data, blockSize) => {
  buffer = Buffer.concat([Buffer.from(buffer), Buffer.from(data)]);
  const per = Math.floor(blockSize / 8);

  const finished_blocks = Math.floor(buffer.length / per);

  const result = buffer.slice(0, finished_blocks * per);
  buffer = buffer.slice(finished_blocks * per);
  return [buffer, result];
};

const bytePaddingPad = (buffer, blockSize, paddingfn) => {
  const per = Math.floor(blockSize / 8);
  const pad_size = per - buffer.length;
  return Buffer.concat([buffer, paddingfn(pad_size)]);
};

const byteUnpaddingUpdate = (buffer, data, blockSize) => {
  buffer = Buffer.concat([Buffer.from(buffer), Buffer.from(data)]);
  const per = Math.floor(blockSize / 8);
  const finished_blocks = Math.max(Math.floor(buffer.length / per) - 1, 0);

  const result = buffer.slice(0, finished_blocks * per);
  buffer = buffer.slice(finished_blocks * per);
  return [buffer, result];
};

const byteUnpaddingCheck = buffer => {
  const pad_size = buffer[buffer.length - 1];
  return buffer.slice(0, -1 * pad_size);
};

module.exports = {
  bytePaddingUpdate,
  bytePaddingPad,
  byteUnpaddingUpdate,
  byteUnpaddingCheck,
};
