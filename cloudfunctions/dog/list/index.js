const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const res = await db.collection('dogs').where({ ownerId: openid }).orderBy('createTime', 'desc').get()
    return { code: 0, data: res.data, message: '查询成功' }
  } catch (err) {
    return { code: -1, message: err.message || '查询失败' }
  }
}
