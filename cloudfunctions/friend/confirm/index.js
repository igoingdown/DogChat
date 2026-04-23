const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
  const { dogId, friendDogId } = event

  if (!dogId || !friendDogId) {
    return { code: -1, message: '参数不完整' }
  }

  const [id1, id2] = dogId < friendDogId ? [dogId, friendDogId] : [friendDogId, dogId]

  try {
    const res = await db.collection('friendships').where({
      dogId: id1,
      friendDogId: id2,
      status: 'pending'
    }).get()

    if (res.data.length === 0) {
      return { code: -1, message: '未找到待确认的请求' }
    }

    await db.collection('friendships').doc(res.data[0]._id).update({
      data: {
        status: 'confirmed',
        confirmTime: db.serverDate()
      }
    })

    return { code: 0, message: '确认成功' }
  } catch (err) {
    return { code: -1, message: err.message || '确认失败' }
  }
}
