const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { dogId } = event

  if (!dogId) {
    return { code: -1, message: 'dogId 不能为空' }
  }

  try {
    const res = await db.collection('friendships').where(_.or([
      { dogId: dogId, status: 'confirmed' },
      { friendDogId: dogId, status: 'confirmed' }
    ])).get()

    const friendDogIds = res.data.map(item => {
      return item.dogId === dogId ? item.friendDogId : item.dogId
    })

    if (friendDogIds.length === 0) {
      return { code: 0, data: [], message: '查询成功' }
    }

    const dogsRes = await db.collection('dogs').where({
      dogId: _.in(friendDogIds)
    }).get()

    return { code: 0, data: dogsRes.data, message: '查询成功' }
  } catch (err) {
    return { code: -1, message: err.message || '查询失败' }
  }
}
