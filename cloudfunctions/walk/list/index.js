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
    const res = await db.collection('walks').where(_.or([
      { dogId: dogId, status: 'active' },
      { invitedDogIds: _.in([dogId]), status: 'active' }
    ])).orderBy('createTime', 'desc').get()

    const walks = res.data
    const allDogIds = new Set()
    walks.forEach(w => {
      allDogIds.add(w.dogId)
      w.invitedDogIds.forEach(id => allDogIds.add(id))
    })

    let dogsMap = {}
    if (allDogIds.size > 0) {
      const dogsRes = await db.collection('dogs').where({
        dogId: _.in([...allDogIds])
      }).get()
      dogsRes.data.forEach(dog => {
        dogsMap[dog.dogId] = dog
      })
    }

    const enrichedWalks = walks.map(walk => ({
      ...walk,
      creatorInfo: dogsMap[walk.dogId] || { name: '未知狗狗', avatar: '' }
    }))

    return { code: 0, data: enrichedWalks, message: '查询成功' }
  } catch (err) {
    return { code: -1, message: err.message || '查询失败' }
  }
}
