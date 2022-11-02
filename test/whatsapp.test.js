const { Whatsapp, WhatsappServer } = require('../src/index');

const main = async () => {
  const whatsapp = new Whatsapp();
  await whatsapp.init({
    mobile: '34611093620',
    proxy: {
      host: '127.0.0.1',
      port: 1086,
    },
  });
  let res = null;

  // get sms code
  // res = await whatsapp.sms();

  // use sms code to register
  // res = await whatsapp.register({ code: '352-002' });

  // if the registration is successful, you can log in directly
  res = await whatsapp.login();

  // send text message
  res = await whatsapp.sendContactTextMessage({
    jid: '34633786770',
    message: 'test hello',
  });

  console.log('res', res);
};

main();
