// 角色
const common = require('./common');

module.exports = {
  uid: {
    type: String,
    require: true,
    uniqe: true,
  },
  aesKey: {
    type: String,
    require: true,
  },
  ...common,
};
