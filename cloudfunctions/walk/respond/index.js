const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
  const { walkId, dogId, status } = event

  if (!walkId || !dogId || !status) {
    return { code: -1, message: '参数不完整' }
  }

  if (!['accepted', 'declined'].includes(status)) {
    return { code: -1, message: '状态无效' }
  }

  try {
    const walkRes = await db.collection('walks').where({ walkId }).get()
    if (walkRes.data.length === 0) {
      return { code: -1, message: '约遛不存在' }
    }

    const walk = walkRes.data[0]
    const responses = walk.responses || []
    const index = responses.findIndex(r => r.dogId === dogId)

    if (index === -1) {
      return { code: -1, message: '你不是被邀请者' }
    }

    responses[index].status = status
    responses[index].respondTime = db.serverDate()

    await db.collection('walks').doc(walk._id).update({
      data: { responses }
    })

    return { code: 0, message: '响应成功' }
  } catch (err) {
    return { code: -1, message: err.message || '响应失败' }
  }
}
