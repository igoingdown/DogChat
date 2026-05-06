const api = require('../../utils/api')
const config = require('../../utils/config')
const app = getApp()

Page({
  data: {
    dogs: [],
    currentDog: null,
    currentDogIndex: 0,
    content: '',
    images: [],
    uploading: false
  },

  onLoad() {
    const dogs = app.globalData.dogs
    const currentDog = app.globalData.currentDog
    const currentDogIndex = Math.max(0, dogs.findIndex(d => currentDog && d.dogId === currentDog.dogId))
    this.setData({
      dogs,
      currentDog,
      currentDogIndex
    })
  },

  onDogChange(e) {
    const index = e.detail.value
    const dog = this.data.dogs[index]
    app.setCurrentDog(dog)
    this.setData({ currentDog: dog, currentDogIndex: index })
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  chooseImage() {
    const remain = 9 - this.data.images.length
    wx.chooseImage({
      count: remain,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ images: [...this.data.images, ...res.tempFilePaths] })
      }
    })
  },

  deleteImage(e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.images.filter((_, i) => i !== index)
    this.setData({ images })
  },

  uploadImages() {
    const { images } = this.data
    if (images.length === 0) return Promise.resolve([])
    if (config.enableMock) return Promise.resolve(images)

    const uploads = images.map(path => {
      return wx.cloud.uploadFile({
        cloudPath: `moments/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`,
        filePath: path
      })
    })

    return Promise.all(uploads).then(results => {
      return results.map(r => r.fileID)
    })
  },

  publish() {
    const { content, images, currentDog, uploading } = this.data
    if (!currentDog) {
      wx.showToast({ title: '请先选择狗狗', icon: 'none' })
      return
    }
    if (!content && images.length === 0) {
      wx.showToast({ title: '内容不能为空', icon: 'none' })
      return
    }
    if (uploading) return

    this.setData({ uploading: true })
    wx.showLoading({ title: '发布中...' })

    this.uploadImages().then(fileIDs => {
      return api.createMoment({
        dogId: currentDog.dogId,
        content,
        images: fileIDs
      })
    }).then(() => {
      wx.hideLoading()
      wx.showToast({ title: '发布成功', icon: 'success' })
      setTimeout(() => {
        wx.navigateBack()
      }, 1000)
    }).catch(err => {
      wx.hideLoading()
      this.setData({ uploading: false })
      wx.showToast({ title: err.message || '发布失败', icon: 'none' })
    })
  }
})
