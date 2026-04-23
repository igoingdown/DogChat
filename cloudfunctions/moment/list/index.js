const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
const _ = db.command

const PAGE_SIZE = 20

exports.main = async (event, context) => {
  const { dogId, page = 1 } = event

  if (!dogId) {
    return { code: -1, message: 'dogId 不能为空' }
  }

  try {
    const friendRes = await db.collection('friendships').where(_.or([
      { dogId: dogId, status: 'confirmed' },
      { friendDogId: dogId, status: 'confirmed' }
    ])).get()

    const friendDogIds = friendRes.data.map(item => {
      return item.dogId === dogId ? item.friendDogId : item.dogId
    })

    friendDogIds.push(dogId)

    const momentsRes = await db.collection('moments')
      .where({ dogId: _.in(friendDogIds) })
      .orderBy('createTime', 'desc')
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .get()

    const moments = momentsRes.data
    const dogIds = [...new Set(moments.map(m => m.dogId))]

    let dogsMap = {}
    if (dogIds.length > 0) {
      const dogsRes = await db.collection('dogs').where({ dogId: _.in(dogIds) }).get()
      dogsRes.data.forEach(dog => {
        dogsMap[dog.dogId] = dog
      })
    }

    const enrichedMoments = moments.map(moment => ({
      ...moment,
      dogInfo: dogsMap[moment.dogId] || { name: '未知狗狗', avatar: '' }
    }))

    return { code: 0, data: enrichedMoments, message: '查询成功' }
  } catch (err) {
    return { code: -1, message: err.message || '查询失败' }
  }
}
