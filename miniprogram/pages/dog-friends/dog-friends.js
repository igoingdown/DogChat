const api = require('../../utils/api')

Page({
  data: {
    dogId: '',
    friends: []
  },

  onLoad(options) {
    const dogId = options.dogId
    this.setData({ dogId })
    this.loadFriends(dogId)
  },

  loadFriends(dogId) {
    api.listFriends(dogId).then(res => {
      this.setData({ friends: res.data || [] })
    })
  }
})
