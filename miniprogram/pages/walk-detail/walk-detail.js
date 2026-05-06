const api = require('../../utils/api')
const app = getApp()

Page({
  data: {
    mode: 'create',
    walkId: '',
    walk: { creatorInfo: {}, responses: [], invitedDogIds: [] },
    time: '',
    location: '',
    friends: [],
    timeIndex: [0, 0, 0],
    timeRange: [],
    isInvited: false
  },

  onLoad(options) {
    const mode = options.mode || 'create'
    this.setData({ mode })

    if (mode === 'create') {
      this.initTimePicker()
      this.loadFriends()
    } else {
      this.setData({ walkId: options.walkId })
      this.loadWalkDetail(options.walkId)
    }
  },

  initTimePicker() {
    const days = []
    const hours = []
    const minutes = []

    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      days.push(`${d.getMonth() + 1}月${d.getDate()}日`)
    }
    for (let i = 0; i < 24; i++) hours.push(`${i}时`)
    for (let i = 0; i < 60; i += 5) minutes.push(`${i}分`)

    this.setData({ timeRange: [days, hours, minutes] })
  },

  onTimeChange(e) {
    const [d, h, m] = e.detail.value
    const timeStr = `${this.data.timeRange[0][d]} ${this.data.timeRange[1][h]}${this.data.timeRange[2][m]}`
    this.setData({ time: timeStr, timeIndex: [d, h, m] })
  },

  onTimeColumnChange(e) {
    const timeIndex = this.data.timeIndex
    timeIndex[e.detail.column] = e.detail.value
    this.setData({ timeIndex })
  },

  onLocationInput(e) {
    this.setData({ location: e.detail.value })
  },

  loadFriends() {
    const currentDog = app.globalData.currentDog
    if (!currentDog) return
    api.listFriends(currentDog.dogId).then(res => {
      const friends = (res.data || []).map(f => ({ ...f, selected: false }))
      this.setData({ friends })
    })
  },

  toggleFriend(e) {
    const index = e.currentTarget.dataset.index
    const friends = this.data.friends
    friends[index].selected = !friends[index].selected
    this.setData({ friends })
  },

  submit() {
    const { time, location, friends } = this.data
    const currentDogData = app.globalData.currentDog

    if (!time || !location) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }

    if (!currentDogData) {
      wx.showToast({ title: '请先选择狗狗', icon: 'none' })
      return
    }

    const invitedDogIds = friends.filter(f => f.selected).map(f => f.dogId)
    if (invitedDogIds.length === 0) {
      wx.showToast({ title: '请至少选择一位狗友', icon: 'none' })
      return
    }

    api.createWalk({
      dogId: currentDogData.dogId,
      time,
      location,
      invitedDogIds
    }).then(() => {
      wx.showToast({ title: '发起成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1000)
    }).catch(err => {
      wx.showToast({ title: err.message || '发起失败', icon: 'none' })
    })
  },

  loadWalkDetail(walkId) {
    const currentDog = app.globalData.currentDog
    api.listWalks(currentDog.dogId).then(res => {
      const walk = (res.data || []).find(w => w.walkId === walkId)
      if (walk) {
        const isInvited = walk.invitedDogIds.includes(currentDog.dogId)
        this.setData({ walk, isInvited })
      }
    })
  },

  respond(e) {
    const status = e.currentTarget.dataset.status
    const { walkId } = this.data
    const currentDog = app.globalData.currentDog

    api.respondWalk({ walkId, dogId: currentDog.dogId, status }).then(() => {
      wx.showToast({ title: status === 'accepted' ? '已接受' : '已拒绝', icon: 'success' })
      this.loadWalkDetail(walkId)
    })
  }
})
