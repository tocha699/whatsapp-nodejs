const Whatsapp = require('../src/whatsapp');

const main = async () => {
  const whatsapp = new Whatsapp();
  await whatsapp.init({
    mobile: '233244040964',
    proxy: {
      host: '127.0.0.1',
      port: 1080,
    },
  });

  const res = await whatsapp.login();
  console.log('res', res);
};

main();
