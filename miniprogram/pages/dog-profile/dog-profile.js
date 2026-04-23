const app = getApp()

Page({
  data: {
    dog: {}
  },

  onLoad(options) {
    const dogId = options.dogId
    const dogs = app.globalData.dogs
    const dog = dogs.find(d => d.dogId === dogId) || {}
    this.setData({ dog })
  },

  showQR() {
    const { dogId } = this.data.dog
    wx.navigateTo({ url: `/pages/dog-qr/dog-qr?dogId=${dogId}` })
  },

  goFriends() {
    const { dogId } = this.data.dog
    wx.navigateTo({ url: `/pages/dog-friends/dog-friends?dogId=${dogId}` })
  }
})
