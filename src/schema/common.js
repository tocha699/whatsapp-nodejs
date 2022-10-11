module.exports = {
  createTime: {
    type: Date,
    name: '创建时间',
    default: Date.now,
  },
  creator: {
    type: String,
    name: '创建人',
  },
  updateTime: {
    type: Date,
    name: '更新时间',
    default: Date.now,
  },
  modifier: {
    type: String,
    name: '修改人',
  },
  isDeleted: {
    type: Boolean,
    name: '是否被删除',
    default: false,
    index: true,
  },
};
