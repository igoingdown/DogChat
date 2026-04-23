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
    this.drawQR(dogId)
  },

  drawQR(dogId) {
    const query = wx.createSelectorQuery()
    query.select('#qrCanvas').fields({ node: true, size: true }).exec((res) => {
      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      const dpr = wx.getSystemInfoSync().pixelRatio
      canvas.width = res[0].width * dpr
      canvas.height = res[0].height * dpr
      ctx.scale(dpr, dpr)

      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, res[0].width, res[0].height)

      ctx.fillStyle = '#333'
      ctx.font = '20px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`dogchat://dog/${dogId}`, res[0].width / 2, res[0].height / 2)
    })
  },

  saveQR() {
    wx.canvasToTempFilePath({
      canvasId: 'qrCanvas',
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            wx.showToast({ title: '保存成功', icon: 'success' })
          },
          fail: () => {
            wx.showToast({ title: '保存失败', icon: 'none' })
          }
        })
      }
    })
  }
})
