const SocketManager = require('./SocketManager');
const logger = require('./logger');

module.exports = {
  init(opts = {}) {
    const { port = 9002 } = opts;
    const socketManager = new SocketManager();
    socketManager.initServer(port);
  },
};
