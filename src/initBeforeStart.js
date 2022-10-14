const libsignal = require('./lib/libsignal-protocol');
const db = require('./db');
const logger = require('./logger');

module.exports = async () => {
  libsignal.curve = (await libsignal.default()).Curve;
  await db.init();
};
