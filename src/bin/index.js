const fse = require('fs-extra');
const path = require('path');

const isDev = await fse.existsSync(path.join(__dirname, './darwin/d0.js'));

const basePath = isDev ? './darwin/' : './linux/';

const obj = {};
for (let i = 0; i <= 6; i++) {
  // eslint-disable-next-line
  obj[`d${i}`] = require(`${basePath}d${i}`);
}

module.exports = obj;
