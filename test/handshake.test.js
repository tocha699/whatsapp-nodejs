const logger = require('../src/logger');
const WASocketClient = require('../src/WASocketClient');

const HandShake = require('../src/protocol/HandShake');
const db = require('../src/db');
const libsignal = require('../src/lib/libsignal-protocol');
const config = require('../src/config');

const main = async () => {
  //
  libsignal.curve = (await libsignal.default()).Curve;
  await db.init();
  const waSocketClient = new WASocketClient({
    proxy: {
      host: '127.0.0.1',
      port: 1087,
      type: 'http',
    },
    mobile: '233244040964',
    socketName: 'Socket_1',
    endpoint: config.getEndPoint(),
  });

  await waSocketClient.init();

  const account = await db.findAccount(233244040964);
  console.log('account', account);

  const handShake = new HandShake(waSocketClient);

  await handShake.start(account, account.serverStaticPublic);
};

main();
