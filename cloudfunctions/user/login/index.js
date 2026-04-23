const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return { code: -1, message: '获取 openid 失败' }
  }

  try {
    const userRes = await db.collection('users').where({ _openid: openid }).get()

    if (userRes.data.length > 0) {
      return { code: 0, data: userRes.data[0], message: '登录成功' }
    }

    const newUser = {
      _openid: openid,
      nickName: '微信用户',
      avatarUrl: '',
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }

    const addRes = await db.collection('users').add({ data: newUser })
    return { code: 0, data: { ...newUser, _id: addRes._id }, message: '注册并登录成功' }
  } catch (err) {
    return { code: -1, message: err.message || '登录失败' }
  }
}
