const api = require('../../utils/api')
const config = require('../../utils/config')
const app = getApp()

Page({
  data: {
    dogId: '',
    isEdit: false,
    avatar: '',
    name: '',
    breed: '',
    ageYears: '',
    ageMonths: '',
    ageDays: '',
    gender: ''
  },

  onLoad(options) {
    if (options.dogId) {
      const dogs = app.globalData.dogs
      const dog = dogs.find(d => d.dogId === options.dogId)
      if (dog) {
        wx.setNavigationBarTitle({ title: '编辑资料' })
        const ageParts = this.parseAge(dog.age)
        this.setData({
          dogId: dog.dogId,
          isEdit: true,
          avatar: dog.avatar || '',
          name: dog.name || '',
          breed: dog.breed || '',
          ageYears: ageParts.years,
          ageMonths: ageParts.months,
          ageDays: ageParts.days,
          gender: dog.gender || ''
        })
      }
    }
  },

  parseAge(age) {
    if (!age) return { years: '', months: '', days: '' }
    if (typeof age === 'number') return { years: String(age), months: '', days: '' }
    if (typeof age === 'string') {
      const y = age.match(/(\d+)岁/)
      const m = age.match(/(\d+)月/)
      const d = age.match(/(\d+)天/)
      return {
        years: y ? y[1] : '',
        months: m ? m[1] : '',
        days: d ? d[1] : ''
      }
    }
    return { years: '', months: '', days: '' }
  },

  formatAge() {
    const { ageYears, ageMonths, ageDays } = this.data
    let parts = []
    if (ageYears) parts.push(ageYears + '岁')
    if (ageMonths) parts.push(ageMonths + '月')
    if (ageDays) parts.push(ageDays + '天')
    return parts.join('') || null
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },

  onBreedInput(e) {
    this.setData({ breed: e.detail.value })
  },

  onAgeYearsInput(e) {
    this.setData({ ageYears: e.detail.value })
  },

  onAgeMonthsInput(e) {
    this.setData({ ageMonths: e.detail.value })
  },

  onAgeDaysInput(e) {
    this.setData({ ageDays: e.detail.value })
  },

  onGenderTap(e) {
    this.setData({ gender: e.currentTarget.dataset.gender })
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
    if (config.enableMock) {
      return Promise.resolve(avatar)
    }
    return wx.cloud.uploadFile({
      cloudPath: `avatars/dog_${Date.now()}.jpg`,
      filePath: avatar
    }).then(res => res.fileID)
  },

  save() {
    const { name, breed, gender, isEdit, dogId } = this.data
    if (!name) {
      wx.showToast({ title: '请填写狗狗名字', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中...' })

    this.uploadAvatar().then(avatar => {
      const data = {
        name,
        avatar,
        breed,
        age: this.formatAge(),
        gender
      }
      if (isEdit) {
        return api.updateDog({ dogId, ...data })
      }
      return api.createDog(data)
    }).then(() => {
      wx.hideLoading()
      wx.showToast({ title: isEdit ? '保存成功' : '创建成功', icon: 'success' })
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
