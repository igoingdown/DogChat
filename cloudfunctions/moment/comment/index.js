const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

function generateCommentId() {
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
  return `CM_${dateStr}_${random}`
}

exports.main = async (event, context) => {
  const { momentId, dogId, content } = event

  if (!momentId || !dogId || !content) {
    return { code: -1, message: '参数不完整' }
  }

  try {
    const secRes = await cloud.openapi.security.msgSecCheck({ content })
    if (secRes.errCode !== 0) {
      return { code: -1, message: '评论包含敏感信息，请修改后重试' }
    }

    const commentId = generateCommentId()
    await db.collection('comments').add({
      data: {
        commentId,
        momentId,
        dogId,
        content,
        createTime: db.serverDate()
      }
    })

    const moment = await db.collection('moments').where({ momentId }).get()
    if (moment.data.length > 0) {
      await db.collection('moments').doc(moment.data[0]._id).update({
        data: { commentCount: db.command.inc(1) }
      })
    }

    return { code: 0, message: '评论成功' }
  } catch (err) {
    return { code: -1, message: err.message || '评论失败' }
  }
}
