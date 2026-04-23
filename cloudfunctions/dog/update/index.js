const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
  const { dogId, name, avatar, breed, age, gender, tags } = event

  if (!dogId) {
    return { code: -1, message: 'dogId 不能为空' }
  }

  try {
    const updateData = { updateTime: db.serverDate() }
    if (name !== undefined) updateData.name = name
    if (avatar !== undefined) updateData.avatar = avatar
    if (breed !== undefined) updateData.breed = breed
    if (age !== undefined) updateData.age = age
    if (gender !== undefined) updateData.gender = gender
    if (tags !== undefined) updateData.tags = tags

    await db.collection('dogs').where({ dogId }).update({ data: updateData })
    return { code: 0, message: '更新成功' }
  } catch (err) {
    return { code: -1, message: err.message || '更新失败' }
  }
}
