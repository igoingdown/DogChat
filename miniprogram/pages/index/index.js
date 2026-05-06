const api = require('../../utils/api')
const format = require('../../utils/format')
const app = getApp()

Page({
  data: {
    moments: [],
    dogs: [],
    currentDog: null,
    currentDogIndex: 0,
    loading: false,
    page: 1,
    hasMore: true
  },

  onLoad() {
    this.checkLogin()
  },

  onShow() {
    if (app.globalData.openid) {
      this.loadDogs()
    }
  },

  onPullDownRefresh() {
    this.setData({ page: 1, moments: [] })
    this.loadMoments().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 })
      this.loadMoments()
    }
  },

  checkLogin() {
    const openid = app.globalData.openid
    if (!openid) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    this.loadDogs()
  },

  loadDogs() {
    api.listDogs().then(res => {
      const dogs = res.data || []
      const currentDog = app.globalData.currentDog || dogs[0] || null
      this.setData({ dogs, currentDog })
      if (currentDog) {
        this.loadMoments()
      }
    })
  },

  loadMoments() {
    const { currentDog, page } = this.data
    if (!currentDog) return Promise.resolve()

    this.setData({ loading: true })
    return api.listMoments(currentDog.dogId, page).then(res => {
      const moments = res.data || []
      const formatted = moments.map(m => ({
        ...m,
        formattedTime: format.formatTime(m.createTime),
        liked: false,
        comments: m.comments || []
      }))

      this.setData({
        moments: page === 1 ? formatted : [...this.data.moments, ...formatted],
        hasMore: moments.length === 20,
        loading: false
      })
    }).catch(() => {
      this.setData({ loading: false })
    })
  },

  onDogChange(e) {
    const index = e.detail.value
    const dog = this.data.dogs[index]
    app.setCurrentDog(dog)
    this.setData({
      currentDog: dog,
      currentDogIndex: index,
      page: 1,
      moments: []
    })
    this.loadMoments()
  },

  onLike(e) {
    const momentId = e.currentTarget.dataset.momentId
    const { currentDog } = this.data
    if (!currentDog) return

    api.likeMoment({ momentId, dogId: currentDog.dogId }).then(res => {
      const moments = this.data.moments.map(m => {
        if (m.momentId === momentId) {
          return {
            ...m,
            liked: res.data.liked,
            likeCount: res.data.liked ? m.likeCount + 1 : m.likeCount - 1
          }
        }
        return m
      })
      this.setData({ moments })
    })
  },

  onComment(e) {
    const momentId = e.currentTarget.dataset.momentId
    wx.showModal({
      title: '评论',
      editable: true,
      placeholderText: '写下你的评论...',
      success: (res) => {
        if (res.confirm && res.content) {
          const { currentDog } = this.data
          api.commentMoment({
            momentId,
            dogId: currentDog.dogId,
            content: res.content
          }).then(() => {
            wx.showToast({ title: '评论成功', icon: 'success' })
            const moments = this.data.moments.map(m => {
              if (m.momentId === momentId) {
                const newComment = {
                  commentId: 'local_' + Date.now(),
                  momentId,
                  dogId: currentDog.dogId,
                  content: res.content,
                  dogInfo: { name: currentDog.name, avatar: currentDog.avatar || '' }
                }
                return {
                  ...m,
                  commentCount: m.commentCount + 1,
                  comments: [...(m.comments || []), newComment]
                }
              }
              return m
            })
            this.setData({ moments })
          })
        }
      }
    })
  },

  previewImage(e) {
    const { urls, current } = e.currentTarget.dataset
    wx.previewImage({ urls, current })
  },

  goPublish() {
    wx.navigateTo({ url: '/pages/publish/publish' })
  }
})
