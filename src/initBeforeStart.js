const libsignal = require('./lib/libsignal');
const db = require('./db');
const logger = require('./logger');

module.exports = async () => {
  libsignal.curve = (await libsignal.default()).Curve;
  await db.init();
};
