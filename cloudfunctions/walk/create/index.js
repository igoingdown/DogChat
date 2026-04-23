const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

function generateWalkId() {
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
  return `WK_${dateStr}_${random}`
}

exports.main = async (event, context) => {
  const { dogId, time, location, latitude, longitude, invitedDogIds } = event

  if (!dogId || !time || !location || !invitedDogIds || invitedDogIds.length === 0) {
    return { code: -1, message: '参数不完整' }
  }

  try {
    const walkId = generateWalkId()
    const responses = invitedDogIds.map(id => ({
      dogId: id,
      status: 'pending',
      respondTime: null
    }))

    await db.collection('walks').add({
      data: {
        walkId,
        dogId,
        time,
        location,
        latitude: latitude || null,
        longitude: longitude || null,
        invitedDogIds,
        responses,
        createTime: db.serverDate(),
        status: 'active'
      }
    })

    return { code: 0, data: { walkId }, message: '发起成功' }
  } catch (err) {
    return { code: -1, message: err.message || '发起失败' }
  }
}
