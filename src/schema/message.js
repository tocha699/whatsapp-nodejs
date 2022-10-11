module.exports = {
  mobile: {
    type: String,
    index: true,
  },
  to: {
    type: String,
    name: '接收者',
    index: true,
  },
  mediaType: {
    type: String,
    default: 'text',
  },
  from: {
    type: String,
    index: true,
  },
  id: {
    type: String,
    name: '消息 id',
    index: true,
  },
  attrs: {
    type: Object,
  },
  record: {
    type: String,
    name: '消息内容',
  },
  timestamp: {
    type: Number,
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
  retry: {
    type: Number,
    name: '重试次数',
    default: 0,
  },
};
