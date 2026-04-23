const api = require('../../utils/api')
const app = getApp()

Page({
  login() {
    wx.showLoading({ title: '登录中...' })

    api.login().then(res => {
      wx.hideLoading()
      const user = res.data
      app.globalData.openid = user._openid
      app.globalData.userInfo = user
      wx.setStorageSync('openid', user._openid)

      wx.showToast({ title: '登录成功', icon: 'success' })
      app.fetchUserDogs()

      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 800)
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({ title: err.message || '登录失败', icon: 'none' })
    })
  }
})
