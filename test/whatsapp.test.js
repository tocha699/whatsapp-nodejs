const { Whatsapp, WhatsappServer } = require('../src/index');

const main = async () => {
  const whatsapp = new Whatsapp();
  await whatsapp.init({
    mobile: '8613500062812',
    proxy: {
      host: '127.0.0.1',
      port: 1086,
    },
  });

  const res = await whatsapp.sms();
  console.log('res', res);

  // WhatsappServer.init(9002);
};

main();
