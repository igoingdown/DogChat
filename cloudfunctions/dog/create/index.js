const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

function generateDogId() {
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
  return `DG_${dateStr}_${random}`
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { name, avatar, breed, age, gender, tags } = event

  if (!name) {
    return { code: -1, message: '狗狗名字不能为空' }
  }

  try {
    let dogId = generateDogId()
    let exists = await db.collection('dogs').where({ dogId }).get()
    while (exists.data.length > 0) {
      dogId = generateDogId()
      exists = await db.collection('dogs').where({ dogId }).get()
    }

    const newDog = {
      dogId,
      ownerId: openid,
      name,
      avatar: avatar || '',
      breed: breed || '',
      age: age || null,
      gender: gender || '',
      tags: tags || [],
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }

    const addRes = await db.collection('dogs').add({ data: newDog })
    return { code: 0, data: { ...newDog, _id: addRes._id }, message: '创建成功' }
  } catch (err) {
    return { code: -1, message: err.message || '创建失败' }
  }
}
