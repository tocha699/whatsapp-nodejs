const { Whatsapp, WhatsappServer } = require('../src/index');

const main = async () => {
  const whatsapp = new Whatsapp();
  await whatsapp.init({
    mobile: '8613888888888',
    proxy: {
      host: '127.0.0.1',
      port: 1086,
    },
  });
  let res = null;

  // res = await whatsapp.sms();

  // res = await whatsapp.register({ code: '352-002' });

  res = await whatsapp.login();

  console.log('res', res);
};

main();
