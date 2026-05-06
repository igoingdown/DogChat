const app = getApp()
const qrcode = require('../../utils/qrcode')

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
    const content = `dogchat://dog/${dogId}`
    const query = wx.createSelectorQuery()
    query.select('#qrCanvas').fields({ node: true, size: true }).exec((res) => {
      if (!res[0]) return
      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      const dpr = wx.getSystemInfoSync().pixelRatio
      const width = res[0].width
      canvas.width = width * dpr
      canvas.height = width * dpr
      ctx.scale(dpr, dpr)

      qrcode.drawQRCode(ctx, content, width)
    })
  },

  saveQR() {
    const query = wx.createSelectorQuery()
    query.select('#qrCanvas').fields({ node: true, size: true }).exec((res) => {
      if (!res[0]) return
      const canvas = res[0].node
      wx.canvasToTempFilePath({
        canvas,
        success: (tmpRes) => {
          wx.saveImageToPhotosAlbum({
            filePath: tmpRes.tempFilePath,
            success: () => {
              wx.showToast({ title: '保存成功', icon: 'success' })
            },
            fail: () => {
              wx.showToast({ title: '保存失败', icon: 'none' })
            }
          })
        }
      })
    })
  }
})
