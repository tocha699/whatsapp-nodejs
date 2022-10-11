const logger = require('../src/logger');
const WASocketClient = require('../src/WASocketClient');

const main = async () => {
  //

  const waSocketClient = new WASocketClient({
    proxy: {
      host: 'localhost',
      port: 1080,
    },
    mobile: '233244040964',
    socketName: 'Socket_1',
    endpoint: {
      host: 'e1.whatsapp.net',
      port: 443,
    },
  });

  await waSocketClient.init();
};

main();
