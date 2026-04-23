const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { dogId, friendDogId } = event

  if (!dogId || !friendDogId) {
    return { code: -1, message: '参数不完整' }
  }

  if (dogId === friendDogId) {
    return { code: -1, message: '不能添加自己为狗友' }
  }

  const [id1, id2] = dogId < friendDogId ? [dogId, friendDogId] : [friendDogId, dogId]

  try {
    const exists = await db.collection('friendships').where({
      dogId: id1,
      friendDogId: id2
    }).get()

    if (exists.data.length > 0) {
      const status = exists.data[0].status
      if (status === 'confirmed') {
        return { code: -1, message: '已经是狗友了' }
      }
      return { code: -1, message: '请求已发送，等待对方确认' }
    }

    await db.collection('friendships').add({
      data: {
        dogId: id1,
        friendDogId: id2,
        status: 'pending',
        requesterId: dogId,
        createTime: db.serverDate(),
        confirmTime: null
      }
    })

    return { code: 0, message: '请求发送成功' }
  } catch (err) {
    return { code: -1, message: err.message || '请求失败' }
  }
}
