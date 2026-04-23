const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

function generateMomentId() {
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
  return `MM_${dateStr}_${random}`
}

exports.main = async (event, context) => {
  const { dogId, content, images } = event

  if (!dogId) {
    return { code: -1, message: 'dogId 不能为空' }
  }

  if (!content && (!images || images.length === 0)) {
    return { code: -1, message: '内容和图片不能同时为空' }
  }

  try {
    const secRes = await cloud.openapi.security.msgSecCheck({
      content: content || ''
    })

    if (secRes.errCode !== 0) {
      return { code: -1, message: '内容包含敏感信息，请修改后重试' }
    }

    let momentId = generateMomentId()
    let exists = await db.collection('moments').where({ momentId }).get()
    while (exists.data.length > 0) {
      momentId = generateMomentId()
      exists = await db.collection('moments').where({ momentId }).get()
    }

    const newMoment = {
      momentId,
      dogId,
      content: content || '',
      images: images || [],
      likeCount: 0,
      commentCount: 0,
      createTime: db.serverDate()
    }

    const addRes = await db.collection('moments').add({ data: newMoment })
    return { code: 0, data: { ...newMoment, _id: addRes._id }, message: '发布成功' }
  } catch (err) {
    return { code: -1, message: err.message || '发布失败' }
  }
}
