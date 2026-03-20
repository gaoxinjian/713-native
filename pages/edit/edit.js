/** pages/edit/edit.js **/
const { getPresetById, updatePreset, addPreset } = require('../../utils/storage.js')

Page({
  data: {
    presetId: null,
    preset: {
      name: '',
      options: []
    },
    isNew: false
  },

  onLoad(options) {
    if (options.id) {
      // 编辑现有预设
      const preset = getPresetById(parseInt(options.id))
      if (preset) {
        this.setData({
          presetId: preset.id,
          preset: JSON.parse(JSON.stringify(preset))
        })
      }
    } else {
      // 新建预设
      this.setData({
        isNew: true,
        preset: {
          name: '新转盘',
          options: [
            { label: '选项1' },
            { label: '选项2' },
            { label: '选项3' }
          ]
        }
      })
    }
  },

  // 名称变化
  onNameChange(e) {
    this.setData({
      'preset.name': e.detail.value
    })
  },

  // 选项变化
  onOptionChange(e) {
    const index = e.currentTarget.dataset.index
    const value = e.detail.value
    const key = `preset.options[${index}].label`
    this.setData({
      [key]: value
    })
  },

  // 添加选项
  addOption() {
    const options = this.data.preset.options
    options.push({ label: `选项${options.length + 1}` })
    this.setData({
      'preset.options': options
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