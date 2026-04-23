const api = require('../../utils/api')
const app = getApp()

Page({
  data: {
    avatar: '',
    name: '',
    breed: '',
    age: '',
    gender: '',
    genderIndex: 0,
    genders: ['公', '母'],
    avatarFileID: ''
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },

  onBreedInput(e) {
    this.setData({ breed: e.detail.value })
  },

  onAgeInput(e) {
    this.setData({ age: e.detail.value })
  },

  onGenderChange(e) {
    const index = e.detail.value
    this.setData({ genderIndex: index, gender: this.data.genders[index] })
  },

  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ avatar: res.tempFilePaths[0] })
      }
    })
  },

  uploadAvatar() {
    const { avatar } = this.data
    if (!avatar || avatar.startsWith('cloud://')) {
      return Promise.resolve(avatar)
    }
    return wx.cloud.uploadFile({
      cloudPath: `avatars/dog_${Date.now()}.jpg`,
      filePath: avatar
    }).then(res => res.fileID)
  },

  save() {
    const { name, breed, age, gender } = this.data
    if (!name) {
      wx.showToast({ title: '请填写狗狗名字', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中...' })

    this.uploadAvatar().then(avatar => {
      return api.createDog({
        name,
        avatar,
        breed,
        age: age ? parseInt(age) : null,
        gender
      })
    }).then(() => {
      wx.hideLoading()
      wx.showToast({ title: '创建成功', icon: 'success' })
      app.fetchUserDogs()
      setTimeout(() => {
        wx.navigateBack()
      }, 1000)
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    })
  }
})
