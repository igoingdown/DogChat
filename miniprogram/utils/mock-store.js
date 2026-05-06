const STORAGE_KEY = 'dogchat_mock_db'
const PAGE_SIZE = 20

function now() {
  return new Date().toISOString()
}

function generateId(prefix) {
  const date = new Date()
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  const random = String(Math.floor(Math.random() * 100000)).padStart(5, '0')
  return `${prefix}_${dateStr}_${random}`
}

function seedDb() {
  const user = {
    _id: 'mock-user-1',
    _openid: 'mock-openid-1',
    nickName: '本地体验用户',
    avatarUrl: '',
    createTime: now(),
    updateTime: now()
  }
  const myDog = {
    _id: 'mock-dog-1',
    dogId: 'DG_DEMO_001',
    ownerId: user._openid,
    name: '豆包',
    avatar: '',
    breed: '柴犬',
    age: '3岁',
    gender: '♂',
    tags: ['爱玩球'],
    createTime: now(),
    updateTime: now()
  }
  const friendDog = {
    _id: 'mock-dog-2',
    dogId: 'DG_DEMO_002',
    ownerId: 'mock-openid-2',
    name: '奶盖',
    avatar: '',
    breed: '柯基',
    age: '2岁',
    gender: '♀',
    tags: ['亲人'],
    createTime: now(),
    updateTime: now()
  }

  return {
    users: [user],
    dogs: [myDog, friendDog],
    friendships: [{
      _id: 'mock-friendship-1',
      dogId: myDog.dogId,
      friendDogId: friendDog.dogId,
      status: 'confirmed',
      requesterId: myDog.dogId,
      createTime: now(),
      confirmTime: now()
    }],
    moments: [{
      _id: 'mock-moment-1',
      momentId: 'MM_DEMO_001',
      dogId: friendDog.dogId,
      content: '今天在小区花园遇到好多朋友，跑累了但很开心。',
      images: [],
      likeCount: 1,
      commentCount: 0,
      createTime: now()
    }],
    comments: [],
    likes: [{
      _id: 'mock-like-1',
      momentId: 'MM_DEMO_001',
      dogId: myDog.dogId,
      createTime: now()
    }],
    walks: [{
      _id: 'mock-walk-1',
      walkId: 'WK_DEMO_001',
      dogId: friendDog.dogId,
      time: '今天 19时00分',
      location: '小区中心花园',
      latitude: null,
      longitude: null,
      invitedDogIds: [myDog.dogId],
      responses: [{ dogId: myDog.dogId, status: 'pending', respondTime: null }],
      createTime: now(),
      status: 'active'
    }]
  }
}

function readDb() {
  let db = wx.getStorageSync(STORAGE_KEY)
  if (!db) {
    db = seedDb()
    wx.setStorageSync(STORAGE_KEY, db)
  }
  return db
}

function writeDb(db) {
  wx.setStorageSync(STORAGE_KEY, db)
}

function currentOpenid() {
  return wx.getStorageSync('openid') || 'mock-openid-1'
}

function ok(data, message) {
  return Promise.resolve({ code: 0, data, message: message || 'ok' })
}

function fail(message) {
  return Promise.reject(new Error(message))
}

function getFriendDogIds(db, dogId) {
  const ids = db.friendships
    .filter(item => item.status === 'confirmed' && (item.dogId === dogId || item.friendDogId === dogId))
    .map(item => item.dogId === dogId ? item.friendDogId : item.dogId)
  return ids
}

const handlers = {
  user: {
    login() {
      const db = readDb()
      const user = db.users[0]
      wx.setStorageSync('openid', user._openid)
      return ok(user, '登录成功')
    }
  },

  dog: {
    create(event) {
      if (!event.name) return fail('狗狗名字不能为空')
      const db = readDb()
      const dog = {
        _id: generateId('mock-dog'),
        dogId: generateId('DG'),
        ownerId: currentOpenid(),
        name: event.name,
        avatar: event.avatar || '',
        breed: event.breed || '',
        age: event.age || null,
        gender: event.gender || '',
        tags: event.tags || [],
        createTime: now(),
        updateTime: now()
      }
      db.dogs.unshift(dog)
      writeDb(db)
      return ok(dog, '创建成功')
    },

    update(event) {
      if (!event.dogId) return fail('dogId 不能为空')
      const db = readDb()
      const dog = db.dogs.find(item => item.dogId === event.dogId)
      if (!dog) return fail('狗狗不存在')
      ;['name', 'avatar', 'breed', 'age', 'gender', 'tags'].forEach(key => {
        if (event[key] !== undefined) dog[key] = event[key]
      })
      dog.updateTime = now()
      writeDb(db)
      return ok(null, '更新成功')
    },

    list() {
      const db = readDb()
      const dogs = db.dogs.filter(item => item.ownerId === currentOpenid())
      return ok(dogs, '查询成功')
    }
  },

  friend: {
    request(event) {
      if (!event.dogId || !event.friendDogId) return fail('参数不完整')
      if (event.dogId === event.friendDogId) return fail('不能添加自己为狗友')

      const db = readDb()
      const exists = db.friendships.find(item => {
        return (item.dogId === event.dogId && item.friendDogId === event.friendDogId) ||
          (item.dogId === event.friendDogId && item.friendDogId === event.dogId)
      })
      if (exists) return fail(exists.status === 'confirmed' ? '已经是狗友了' : '请求已发送，等待对方确认')

      const ids = event.dogId < event.friendDogId ? [event.dogId, event.friendDogId] : [event.friendDogId, event.dogId]
      db.friendships.push({
        _id: generateId('mock-friendship'),
        dogId: ids[0],
        friendDogId: ids[1],
        status: 'pending',
        requesterId: event.dogId,
        createTime: now(),
        confirmTime: null
      })
      writeDb(db)
      return ok(null, '请求发送成功')
    },

    confirm(event) {
      if (!event.dogId || !event.friendDogId) return fail('参数不完整')
      const db = readDb()
      const friendship = db.friendships.find(item => {
        return item.status === 'pending' &&
          ((item.dogId === event.dogId && item.friendDogId === event.friendDogId) ||
          (item.dogId === event.friendDogId && item.friendDogId === event.dogId))
      })
      if (!friendship) return fail('未找到待确认的请求')
      friendship.status = 'confirmed'
      friendship.confirmTime = now()
      writeDb(db)
      return ok(null, '确认成功')
    },

    list(event) {
      if (!event.dogId) return fail('dogId 不能为空')
      const db = readDb()
      const ids = getFriendDogIds(db, event.dogId)
      return ok(db.dogs.filter(item => ids.includes(item.dogId)), '查询成功')
    }
  },

  moment: {
    create(event) {
      if (!event.dogId) return fail('dogId 不能为空')
      if (!event.content && (!event.images || event.images.length === 0)) return fail('内容和图片不能同时为空')
      const db = readDb()
      const moment = {
        _id: generateId('mock-moment'),
        momentId: generateId('MM'),
        dogId: event.dogId,
        content: event.content || '',
        images: event.images || [],
        likeCount: 0,
        commentCount: 0,
        createTime: now()
      }
      db.moments.unshift(moment)
      writeDb(db)
      return ok(moment, '发布成功')
    },

    list(event) {
      if (!event.dogId) return fail('dogId 不能为空')
      const db = readDb()
      const page = event.page || 1
      const visibleDogIds = getFriendDogIds(db, event.dogId).concat(event.dogId)
      const dogsMap = {}
      db.dogs.forEach(dog => {
        dogsMap[dog.dogId] = dog
      })
      const moments = db.moments
        .filter(item => visibleDogIds.includes(item.dogId))
        .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
        .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
        .map(item => {
          const comments = (db.comments || [])
            .filter(c => c.momentId === item.momentId)
            .sort((a, b) => new Date(a.createTime) - new Date(b.createTime))
            .map(c => ({
              ...c,
              dogInfo: dogsMap[c.dogId] || { name: '未知狗狗', avatar: '' }
            }))
          return {
            ...item,
            dogInfo: dogsMap[item.dogId] || { name: '未知狗狗', avatar: '' },
            comments
          }
        })
      return ok(moments, '查询成功')
    },

    like(event) {
      if (!event.momentId || !event.dogId) return fail('参数不完整')
      const db = readDb()
      const moment = db.moments.find(item => item.momentId === event.momentId)
      if (!moment) return fail('动态不存在')
      const index = db.likes.findIndex(item => item.momentId === event.momentId && item.dogId === event.dogId)
      if (index >= 0) {
        db.likes.splice(index, 1)
        moment.likeCount = Math.max(0, (moment.likeCount || 0) - 1)
        writeDb(db)
        return ok({ liked: false }, '取消点赞成功')
      }
      db.likes.push({ _id: generateId('mock-like'), momentId: event.momentId, dogId: event.dogId, createTime: now() })
      moment.likeCount = (moment.likeCount || 0) + 1
      writeDb(db)
      return ok({ liked: true }, '点赞成功')
    },

    comment(event) {
      if (!event.momentId || !event.dogId || !event.content) return fail('参数不完整')
      const db = readDb()
      const moment = db.moments.find(item => item.momentId === event.momentId)
      if (!moment) return fail('动态不存在')
      db.comments.push({
        _id: generateId('mock-comment'),
        commentId: generateId('CM'),
        momentId: event.momentId,
        dogId: event.dogId,
        content: event.content,
        createTime: now()
      })
      moment.commentCount = (moment.commentCount || 0) + 1
      writeDb(db)
      return ok(null, '评论成功')
    }
  },

  walk: {
    create(event) {
      if (!event.dogId || !event.time || !event.location || !event.invitedDogIds || event.invitedDogIds.length === 0) {
        return fail('参数不完整')
      }
      const db = readDb()
      const walk = {
        _id: generateId('mock-walk'),
        walkId: generateId('WK'),
        dogId: event.dogId,
        time: event.time,
        location: event.location,
        latitude: event.latitude || null,
        longitude: event.longitude || null,
        invitedDogIds: event.invitedDogIds,
        responses: event.invitedDogIds.map(dogId => ({ dogId, status: 'pending', respondTime: null })),
        createTime: now(),
        status: 'active'
      }
      db.walks.unshift(walk)
      writeDb(db)
      return ok({ walkId: walk.walkId }, '发起成功')
    },

    respond(event) {
      if (!event.walkId || !event.dogId || !event.status) return fail('参数不完整')
      const db = readDb()
      const walk = db.walks.find(item => item.walkId === event.walkId)
      if (!walk) return fail('约遛不存在')
      const response = walk.responses.find(item => item.dogId === event.dogId)
      if (!response) return fail('你不是被邀请者')
      response.status = event.status
      response.respondTime = now()
      writeDb(db)
      return ok(null, '响应成功')
    },

    list(event) {
      if (!event.dogId) return fail('dogId 不能为空')
      const db = readDb()
      const dogsMap = {}
      db.dogs.forEach(dog => {
        dogsMap[dog.dogId] = dog
      })
      const walks = db.walks
        .filter(item => item.status === 'active' && (item.dogId === event.dogId || item.invitedDogIds.includes(event.dogId)))
        .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
        .map(item => ({
          ...item,
          creatorInfo: dogsMap[item.dogId] || { name: '未知狗狗', avatar: '' },
          responses: (item.responses || []).map(response => ({
            ...response,
            dogName: dogsMap[response.dogId] ? dogsMap[response.dogId].name : response.dogId
          }))
        }))
      return ok(walks, '查询成功')
    }
  }
}

function callFunction(name, event) {
  const action = event && event.action
  const group = handlers[name]
  const handler = group && group[action]
  if (!handler) return fail(`未知 ${name} action: ${action || ''}`)

  return new Promise(resolve => {
    setTimeout(() => resolve(handler(event || {})), 150)
  }).then(result => result)
}

module.exports = {
  callFunction
}
