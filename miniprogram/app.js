const api = require('./utils/api')
const config = require('./utils/config')

App({
  globalData: {
    userInfo: null,
    openid: null,
    currentDog: null,
    dogs: []
  },

  onLaunch() {
    if (!config.enableMock && wx.cloud) {
      wx.cloud.init({
        traceUser: true
      })
    }

    const openid = wx.getStorageSync('openid')
    if (openid) {
      this.globalData.openid = openid
      this.fetchUserDogs()
    }
  },

  fetchUserDogs() {
    const openid = this.globalData.openid
    if (!openid) return

    api.listDogs().then(res => {
      const dogs = res.data || []
      this.globalData.dogs = dogs
      if (dogs.length > 0 && !this.globalData.currentDog) {
        this.globalData.currentDog = dogs[0]
      }
    }).catch(() => {})
  },

  setCurrentDog(dog) {
    this.globalData.currentDog = dog
  }
})
