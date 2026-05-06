const app = getApp()
const api = require('../../utils/api')

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

  onShow() {
    const { dog } = this.data
    if (dog.dogId) {
      const dogs = app.globalData.dogs
      const updated = dogs.find(d => d.dogId === dog.dogId)
      if (updated) this.setData({ dog: updated })
    }
  },

  editDog() {
    const { dogId } = this.data.dog
    wx.navigateTo({ url: `/pages/dog-edit/dog-edit?dogId=${dogId}` })
  },

  showQR() {
    const { dogId } = this.data.dog
    wx.navigateTo({ url: `/pages/dog-qr/dog-qr?dogId=${dogId}` })
  },

  scanToAdd() {
    const { dogId } = this.data.dog
    if (!dogId) return

    wx.scanCode({
      onlyFromCamera: false,
      success: (res) => {
        const result = res.result || ''
        const match = result.match(/^dogchat:\/\/dog\/(.+)$/)
        if (!match) {
          wx.showToast({ title: '无效的狗友二维码', icon: 'none' })
          return
        }
        this.sendFriendRequest(dogId, match[1])
      },
      fail: () => {
        this.showManualInput(dogId)
      }
    })
  },

  showManualInput(dogId) {
    wx.showModal({
      title: '手动添加狗友',
      editable: true,
      placeholderText: '输入对方狗狗ID',
      success: (res) => {
        if (res.confirm && res.content) {
          this.sendFriendRequest(dogId, res.content.trim())
        }
      }
    })
  },

  sendFriendRequest(dogId, friendDogId) {
    if (dogId === friendDogId) {
      wx.showToast({ title: '不能添加自己为狗友', icon: 'none' })
      return
    }
    api.requestFriend({ dogId, friendDogId }).then(() => {
      wx.showToast({ title: '请求已发送', icon: 'success' })
    }).catch(err => {
      wx.showToast({ title: err.message || '添加失败', icon: 'none' })
    })
  },

  goFriends() {
    const { dogId } = this.data.dog
    wx.navigateTo({ url: `/pages/dog-friends/dog-friends?dogId=${dogId}` })
  }
})
