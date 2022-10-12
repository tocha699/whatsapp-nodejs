module.exports = {
  __version__: {
    type: Number,
    default: 1,
  },
  mobile: {
    type: String,
    index: true,
  },
  cc: {
    type: String,
    index: true,
  },
  mcc: String,
  mnc: String,
  pushName: String, // 昵称
  platform: {
    type: Number,
    default: 0, // 0 个人版，10 商业版
  },
  clientStaticKeypair: {
    // 客户端一组固定公钥
    type: String,
  },
  serverStaticPublic: {
    // 服务端公钥
    type: String,
  },

  lc: String,
  lg: String,
  edgeRoutingInfo: String,
  expid: String,
  fdid: String,
  id: String,

  // 换绑手机
  oldPhone: String,
  oldcc: String,
  oldmcc: String,
  oldmnc: String,

  sim_mcc: String,
  sim_mnc: String,

  // env
  md5Class: String,
  key: String,
  version: String,
  osName: String,
  oSVersion: String,
  deviceName: String,
  manufacturer: String,
  buildVersion: String,

  // ignore
  isCheck: Boolean,
  isRemove: Boolean,

  prekeysReady: {
    type: Boolean,
    default: false,
    title: '是否同步 prekey',
  },
};
