const logger = require('../src/logger');
const WASocketClient = require('../src/WASocketClient');

const HandShake = require('../src/protocol/HandShake');
const db = require('../src/db');

const main = async () => {
  //

  await db.init();
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

  const account = await db.findAccount(233244040964);
  console.log('account', account);
};

main();
