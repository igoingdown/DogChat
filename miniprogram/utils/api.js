const config = require('./config')
const mock = require('./mock-store')

function callFunction(name, data = {}) {
  if (config.enableMock) {
    return mock.callFunction(name, data)
  }

  return wx.cloud.callFunction({ name, data })
    .then(res => {
      if (res.result && res.result.code !== 0) {
        return Promise.reject(new Error(res.result.message || '请求失败'))
      }
      return res.result
    })
    .catch(err => {
      wx.showToast({ title: err.message || '网络错误', icon: 'none' })
      return Promise.reject(err)
    })
}

module.exports = {
  callFunction,

  login() {
    return callFunction('user', { action: 'login' })
  },

  createDog(data) {
    return callFunction('dog', { action: 'create', ...data })
  },

  updateDog(data) {
    return callFunction('dog', { action: 'update', ...data })
  },

  listDogs() {
    return callFunction('dog', { action: 'list' })
  },

  requestFriend(data) {
    return callFunction('friend', { action: 'request', ...data })
  },

  confirmFriend(data) {
    return callFunction('friend', { action: 'confirm', ...data })
  },

  listFriends(dogId) {
    return callFunction('friend', { action: 'list', dogId })
  },

  createMoment(data) {
    return callFunction('moment', { action: 'create', ...data })
  },

  listMoments(dogId, page = 1) {
    return callFunction('moment', { action: 'list', dogId, page })
  },

  likeMoment(data) {
    return callFunction('moment', { action: 'like', ...data })
  },

  commentMoment(data) {
    return callFunction('moment', { action: 'comment', ...data })
  },

  createWalk(data) {
    return callFunction('walk', { action: 'create', ...data })
  },

  respondWalk(data) {
    return callFunction('walk', { action: 'respond', ...data })
  },

  listWalks(dogId) {
    return callFunction('walk', { action: 'list', dogId })
  }
}
