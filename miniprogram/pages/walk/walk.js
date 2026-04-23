const api = require('../../utils/api')
const app = getApp()

Page({
  data: {
    walks: [],
    currentDog: null
  },

  onShow() {
    const currentDog = app.globalData.currentDog
    if (currentDog) {
      this.setData({ currentDog })
      this.loadWalks(currentDog.dogId)
    }
  },

  loadWalks(dogId) {
    api.listWalks(dogId).then(res => {
      const walks = (res.data || []).map(w => {
        const myResponse = w.responses.find(r => r.dogId === dogId)
        return { ...w, myResponse: myResponse ? myResponse.status : null }
      })
      this.setData({ walks })
    })
  },

  createWalk() {
    wx.navigateTo({ url: '/pages/walk-detail/walk-detail?mode=create' })
  },

  goDetail(e) {
    const walk = e.currentTarget.dataset.walk
    wx.navigateTo({
      url: `/pages/walk-detail/walk-detail?mode=detail&walkId=${walk.walkId}`
    })
  }
})
