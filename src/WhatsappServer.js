const SocketManager = require('./SocketManager');
const initBeforeStart = require('./initBeforeStart');

module.exports = {
  async init(opts = {}) {
    await initBeforeStart();
    const { port = 9002 } = opts;
    const socketManager = new SocketManager();
    socketManager.initServer(port);
  },
};
