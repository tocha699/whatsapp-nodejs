module.exports = {
  mobile: {
    type: String,
    index: true,
  },
  isRead: {
    type: Boolean,
    index: true,
    default: false,
  },
  jid: {
    type: String,
    name: '来自',
    index: true,
  },
  gid: {
    type: String,
    name: '群 id',
    default: '',
  },
  id: {
    type: String,
    name: '消息 id',
    index: true,
  },
  message: {
    type: Object,
  },
  t: {
    title: '接收消息时间',
    type: Number,
  },
};
