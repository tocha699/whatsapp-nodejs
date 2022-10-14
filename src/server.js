const SocketManager = require('./SocketManager');
const logger = require('./logger');

process.on('unhandledRejection', (reason, promise) => {
  console.error('wasdk-unhandledRejection', reason, promise);
});
process.on('uncaughtException', error => {
  console.error('wasdk-uncaughtException', error);
});
// UnhandledPromiseRejection

const listenPort = 9002;
const socketManager = new SocketManager();

socketManager.initServer(listenPort);
