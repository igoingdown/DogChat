App({
  globalData: {
    userInfo: null,
    openid: null,
    currentDog: null,
    dogs: []
  },

  onLaunch() {
    wx.cloud.init({
      env: 'your-env-id',
      traceUser: true
    })

    const openid = wx.getStorageSync('openid')
    if (openid) {
      this.globalData.openid = openid
      this.fetchUserDogs()
    }
  },

  fetchUserDogs() {
    const openid = this.globalData.openid
    if (!openid) return

    wx.cloud.callFunction({
      name: 'dog',
      data: { action: 'list' }
    }).then(res => {
      const dogs = res.result.data || []
      this.globalData.dogs = dogs
      if (dogs.length > 0 && !this.globalData.currentDog) {
        this.globalData.currentDog = dogs[0]
      }
    })
  },

  setCurrentDog(dog) {
    this.globalData.currentDog = dog
  }
})
