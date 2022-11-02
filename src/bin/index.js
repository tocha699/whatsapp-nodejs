const fse = require('fs-extra');
const path = require('path');

const isDev = fse.existsSync(path.join(__dirname, './darwin/d0.js'));

const basePath = isDev ? './darwin/' : './linux/';

const files = fse.readdirSync(path.join(__dirname, './darwin')).filter(item => item[0] !== '.');

const obj = {};
for (let i = 0; i < files.length; i++) {
  // eslint-disable-next-line
  obj[`d${i}`] = require(`${basePath}d${i}`);
}

module.exports = obj;
