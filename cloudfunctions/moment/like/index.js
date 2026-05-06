const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { momentId, dogId } = event

  if (!momentId || !dogId) {
    return { code: -1, message: '参数不完整' }
  }

  try {
    const likeRes = await db.collection('likes').where({ momentId, dogId }).get()

    if (likeRes.data.length > 0) {
      await db.collection('likes').doc(likeRes.data[0]._id).remove()

      const moment = await db.collection('moments').where({ momentId }).get()
      if (moment.data.length > 0) {
        const newCount = Math.max(0, (moment.data[0].likeCount || 0) - 1)
        await db.collection('moments').doc(moment.data[0]._id).update({
          data: { likeCount: newCount }
        })
      }

      return { code: 0, data: { liked: false }, message: '取消点赞成功' }
    }

    await db.collection('likes').add({
      data: { momentId, dogId, createTime: db.serverDate() }
    })

    const moment = await db.collection('moments').where({ momentId }).get()
    if (moment.data.length > 0) {
      await db.collection('moments').doc(moment.data[0]._id).update({
        data: { likeCount: _.inc(1) }
      })
    }

    return { code: 0, data: { liked: true }, message: '点赞成功' }
  } catch (err) {
    return { code: -1, message: err.message || '操作失败' }
  }
}
