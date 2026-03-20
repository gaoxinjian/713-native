App({
  globalData: {
    selectedPreset: null
  },
  
  onLaunch() {
    // 初始化存储
    const presets = wx.getStorageSync('presets')
    if (!presets || presets.length === 0) {
      // 默认预设
      const defaultPresets = [
        {
          id: Date.now(),
          name: '今天吃什么',
          options: [
            { label: '火锅', color: '#FF6B6B' },
            { label: '烧烤', color: '#4ECDC4' },
            { label: '披萨', color: '#45B7D1' },
            { label: '寿司', color: '#96CEB4' },
            { label: '汉堡', color: '#FFEAA7' },
            { label: '面条', color: '#DDA0DD' }
          ]
        },
        {
          id: Date.now() + 1,
          name: '谁去买单',
          options: [
            { label: '我请客', color: '#FF6B6B' },
            { label: '你请客', color: '#4ECDC4' },
            { label: 'AA制', color: '#45B7D1' },
            { label: '猜拳决定', color: '#96CEB4' }
          ]
        }
      ]
      wx.setStorageSync('presets', defaultPresets)
    }
  }
})