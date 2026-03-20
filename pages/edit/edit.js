/** pages/edit/edit.js **/
const { getPresetById, updatePreset, addPreset } = require('../../utils/storage.js')

Page({
  data: {
    presetId: null,
    preset: {
      name: '',
      options: []
    },
    isNew: false,
    probabilitySum: 0,
    probabilityError: ''
  },

  onLoad(options) {
    if (options.id) {
      // 编辑现有预设
      const preset = getPresetById(parseInt(options.id))
      if (preset) {
        // 兼容旧数据：如果没有 probability 字段，设为 null
        const optionsWithProb = preset.options.map(opt => ({
          ...opt,
          probability: opt.probability !== undefined ? opt.probability : null
        }))
        const newPreset = {
          ...preset,
          options: optionsWithProb
        }
        this.setData({
          presetId: preset.id,
          preset: newPreset
        })
        this.calculateProbabilitySum()
      }
    } else {
      // 新建预设
      this.setData({
        isNew: true,
        preset: {
          name: '新转盘',
          options: [
            { label: '选项1', probability: null },
            { label: '选项2', probability: null },
            { label: '选项3', probability: null }
          ]
        }
      })
    }
  },

  // 计算概率总和
  calculateProbabilitySum() {
    const options = this.data.preset.options
    let sum = 0
    let hasCustomProb = false

    options.forEach(opt => {
      if (opt.probability !== null && opt.probability !== undefined && opt.probability !== '') {
        const prob = parseFloat(opt.probability)
        if (!isNaN(prob) && prob >= 0) {
          sum += prob
          hasCustomProb = true
        }
      }
    })

    // 如果没有自定义概率，视为平均分配，总和为100
    if (!hasCustomProb) {
      sum = 100
    }

    sum = Math.round(sum * 10) / 10 // 保留一位小数

    let error = ''
    if (hasCustomProb && sum !== 100) {
      error = `概率总和必须为100%，当前为 ${sum}%`
    }

    this.setData({
      probabilitySum: sum,
      probabilityError: error
    })

    return { sum, hasCustomProb, error }
  },

  // 名称变化
  onNameChange(e) {
    this.setData({
      'preset.name': e.detail.value
    })
  },

  // 选项文字变化
  onOptionChange(e) {
    const index = e.currentTarget.dataset.index
    const value = e.detail.value
    const key = `preset.options[${index}].label`
    this.setData({
      [key]: value
    })
  },

  // 概率变化
  onProbabilityChange(e) {
    const index = e.currentTarget.dataset.index
    let value = e.detail.value

    // 只允许数字和小数点
    if (value && !/^\d*\.?\d*$/.test(value)) {
      return
    }

    // 限制范围 0-100
    if (value !== '' && value !== null) {
      const num = parseFloat(value)
      if (num > 100) {
        value = '100'
      }
      if (num < 0) {
        value = '0'
      }
    }

    const key = `preset.options[${index}].probability`
    this.setData({
      [key]: value === '' ? null : value
    }, () => {
      this.calculateProbabilitySum()
    })
  },

  // 添加选项
  addOption() {
    const options = this.data.preset.options
    options.push({ label: `选项${options.length + 1}`, probability: null })
    this.setData({
      'preset.options': options
    }, () => {
      this.calculateProbabilitySum()
    })
  },

  // 删除选项
  deleteOption(e) {
    const index = e.currentTarget.dataset.index
    const options = this.data.preset.options
    if (options.length <= 2) {
      wx.showToast({ title: '至少需要2个选项', icon: 'none' })
      return
    }
    options.splice(index, 1)
    this.setData({
      'preset.options': options
    }, () => {
      this.calculateProbabilitySum()
    })
  },

  // 保存预设
  savePreset() {
    const { preset, presetId, isNew } = this.data

    if (!preset.name.trim()) {
      wx.showToast({ title: '请输入转盘名称', icon: 'none' })
      return
    }

    if (preset.options.length < 2) {
      wx.showToast({ title: '至少需要2个选项', icon: 'none' })
      return
    }

    // 过滤空选项
    preset.options = preset.options.filter(opt => opt.label.trim())
    if (preset.options.length < 2) {
      wx.showToast({ title: '至少需要2个有效选项', icon: 'none' })
      return
    }

    // 验证概率
    const { hasCustomProb, error } = this.calculateProbabilitySum()
    if (hasCustomProb && error) {
      wx.showToast({ title: error, icon: 'none' })
      return
    }

    // 转换概率为数字
    preset.options = preset.options.map(opt => ({
      ...opt,
      probability: opt.probability !== null && opt.probability !== undefined && opt.probability !== ''
        ? parseFloat(opt.probability)
        : null
    }))

    if (isNew) {
      addPreset(preset)
    } else {
      updatePreset(presetId, preset)
    }

    wx.showToast({
      title: '保存成功',
      icon: 'success',
      success: () => {
        setTimeout(() => {
          wx.navigateBack()
        }, 500)
      }
    })
  }
})