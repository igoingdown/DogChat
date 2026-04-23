const api = require('../../utils/api')
const app = getApp()

Page({
  data: {
    userInfo: {},
    dogs: []
  },

  onShow() {
    this.loadUserInfo()
    this.loadDogs()
  },

  loadUserInfo() {
    const openid = app.globalData.openid
    if (!openid) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    this.setData({ userInfo: { nickName: app.globalData.userInfo?.nickName || '微信用户' } })
  },

  loadDogs() {
    api.listDogs().then(res => {
      this.setData({ dogs: res.data || [] })
      app.globalData.dogs = res.data || []
    })
  },

  addDog() {
    wx.navigateTo({ url: '/pages/dog-edit/dog-edit' })
  },

  goDogProfile(e) {
    const dog = e.currentTarget.dataset.dog
    wx.navigateTo({
      url: `/pages/dog-profile/dog-profile?dogId=${dog.dogId}`
    })
  }
})
