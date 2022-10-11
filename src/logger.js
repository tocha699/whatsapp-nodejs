const bunyan = require('bunyan');
const bunyanDebugStream = require('bunyan-debug-stream');
const path = require('path');
const fse = require('fs-extra');
const os = require('os');

const env = process.env.NODE_ENV;
const isProduction = env === 'production' && os.platform() !== 'darwin';

let logDir = path.join(__dirname, '../logs/');

if (isProduction) {
  logDir = `/root/logs/`;
}

fse.ensureDirSync(logDir);

const debugStream = {
  level: 'debug',
  type: 'raw',
  stream: bunyanDebugStream({
    forceColor: true,
  }),
};

const debugFileStream = {
  level: 'debug',
  type: 'rotating-file',
  path: path.join(logDir, `whatsapp.debug.log`),
  period: '1d',
  count: 7,
};

const errorFileStream = {
  level: 'error',
  type: 'rotating-file',
  path: path.join(logDir, `whatsapp.error.log`),
  period: '1d',
  count: 7,
};

const fatalFileStream = {
  level: 'fatal',
  type: 'rotating-file',
  path: path.join(logDir, `whatsapp.fatal.log`),
  period: '1d',
  count: 7,
};

const streams = [];

if (isProduction) {
  streams.push(errorFileStream);
} else {
  streams.push(debugStream);
  streams.push(debugFileStream);
  streams.push(errorFileStream);
  streams.push(fatalFileStream);
}

const logger = bunyan.createLogger({
  name: 'WA',
  streams,
});

['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'child'].forEach(method => {
  // eslint-disable-next-line
  global.console[method] = function() {
    // eslint-disable-next-line
    return logger[method].apply(logger, arguments);
  };
});
// eslint-disable-next-line
console.log = function() {
  // eslint-disable-next-line
  logger.info.apply(logger, arguments);
};

module.exports = logger;
