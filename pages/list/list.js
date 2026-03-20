/** pages/list/list.js **/
const { getPresets, deletePreset, addPreset } = require('../../utils/storage.js')

Page({
  data: {
    presets: []
  },

  onShow() {
    this.loadPresets()
  },

  loadPresets() {
    const presets = getPresets()
    this.setData({ presets })
  },

  // 选择预设
  selectPreset(e) {
    const preset = e.currentTarget.dataset.preset
    const app = getApp()
    app.globalData.selectedPreset = preset
    wx.navigateBack()
  },

  // 编辑预设
  editPreset(e) {
    e.stopPropagation()
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/edit/edit?id=${id}`
    })
  },

  // 删除预设
  deletePreset(e) {
    e.stopPropagation()
    const id = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个转盘吗？',
      success: (res) => {
        if (res.confirm) {
          deletePreset(id)
          this.loadPresets()
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  },

  // 新建预设
  addPreset() {
    wx.showModal({
      title: '新建转盘',
      placeholderText: '输入转盘名称',
      editable: true,
      success: (res) => {
        if (res.confirm && res.content) {
          const newPreset = {
            name: res.content,
            options: [
              { label: '选项1' },
              { label: '选项2' },
              { label: '选项3' }
            ]
          }
          addPreset(newPreset)
          this.loadPresets()
          wx.showToast({ title: '创建成功', icon: 'success' })
        }
      }
    })
  }
})