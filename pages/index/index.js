/** pages/index/index.js **/
const { getPresets, savePresets } = require('../../utils/storage.js')

Page({
  data: {
    size: 300,
    radius: 140,
    center: 150,
    options: [],
    currentRotation: 0,
    targetRotation: 0,
    animActive: false,
    result: '',
    transitionDuration: '0s',
    ctx: null,
    rotatorStyle: '',
    wheelImage: ''
  },

  onLoad() {
    this.initCanvas()
  },

  onShow() {
    const app = getApp()
    if (app.globalData.selectedPreset) {
      this.loadPreset(app.globalData.selectedPreset)
      app.globalData.selectedPreset = null
    } else {
      // 首次加载，使用默认预设
      let presets = getPresets()
      if (presets.length === 0) {
        // 没有预设时，创建默认预设
        presets = [this.createDefaultPreset()]
        savePresets(presets)
      }
      this.loadPreset(presets[0])
    }
  },

  // 创建默认预设
  createDefaultPreset() {
    const defaultOptions = [
      { label: '火锅' },
      { label: '烧烤' },
      { label: '日料' },
      { label: '韩餐' },
      { label: '川菜' },
      { label: '粤菜' }
    ]
    return {
      id: Date.now(),
      name: '今天吃什么',
      options: this.generateColors(defaultOptions)
    }
  },

  // 计算属性
  angleStep() {
    return 360 / this.data.options.length
  },

  // 更新转盘旋转样式
  updateRotatorStyle() {
    const { currentRotation, transitionDuration } = this.data
    const rotatorStyle = `transform: rotate(${currentRotation}deg); transition: transform ${transitionDuration} cubic-bezier(0.25, 0.1, 0.25, 1);`
    this.setData({ rotatorStyle })
  },

  initCanvas() {
    const ctx = wx.createCanvasContext('wheelCanvas', this)
    this.setData({ ctx }, () => {
      // canvas 初始化完成后，如果有选项就绘制
      if (this.data.options.length > 0) {
        this.drawWheel()
      }
    })
  },

  // 绘制转盘
  drawWheel() {
    const ctx = this.data.ctx
    if (!ctx) return

    const { size, radius, center, options } = this.data
    const angleStep = (360 / options.length * Math.PI) / 180

    ctx.clearRect(0, 0, size, size)

    options.forEach((item, index) => {
      const start = index * angleStep - Math.PI / 2
      const end = (index + 1) * angleStep - Math.PI / 2

      // 绘制扇形
      ctx.beginPath()
      ctx.moveTo(center, center)
      ctx.arc(center, center, radius, start, end)
      ctx.closePath()
      ctx.fillStyle = item.color
      ctx.fill()

      // 在扇形中央绘制文字
      const midAngle = start + angleStep / 2
      const textRadius = radius * 0.65
      const x = center + Math.cos(midAngle) * textRadius
      const y = center + Math.sin(midAngle) * textRadius

      ctx.save()
      ctx.translate(x, y)
      // 文字旋转角度：让文字沿着半径方向指向中心
      ctx.rotate(midAngle + Math.PI / 2)
      ctx.font = 'bold 14px "PingFang SC", "Helvetica Neue", sans-serif'
      ctx.fillStyle = '#2c3e50'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(item.label, 0, 0)
      ctx.restore()
    })

    // 绘制中心小圆
    ctx.beginPath()
    ctx.arc(center, center, 20, 0, 2 * Math.PI)
    ctx.fillStyle = '#f5f5f5'
    ctx.fill()
    ctx.strokeStyle = '#cccccc'
    ctx.lineWidth = 2
    ctx.stroke()

    // 旧版 canvas 需要调用 draw 渲染
    ctx.draw(false, () => {
      // 绘制完成后导出图片
      wx.canvasToTempFilePath({
        canvasId: 'wheelCanvas',
        success: (res) => {
          this.setData({ wheelImage: res.tempFilePath })
        }
      }, this)
    })
  },

  // 开始旋转
  startSpin() {
    if (this.data.animActive) return

    const options = this.data.options
    if (options.length === 0) {
      wx.showToast({ title: '请先添加选项', icon: 'none' })
      return
    }

    const step = 360 / options.length
    const threshold = 1

    // 生成目标指针角度，避开边界
    let targetPointer
    let attempts = 0
    do {
      targetPointer = Math.random() * 360
      const remainder = targetPointer % step
      if (remainder < threshold) {
        targetPointer += threshold
      } else if (remainder > step - threshold) {
        targetPointer -= threshold
      }
      targetPointer = (targetPointer + 360) % 360
      const newRemainder = targetPointer % step
      if (newRemainder >= threshold && newRemainder <= step - threshold) break
      attempts++
    } while (attempts < 10)

    // 计算当前指针角度
    const currentPointer = ((-this.data.currentRotation) % 360 + 360) % 360

    // 计算需要旋转的增量
    let delta = (targetPointer - currentPointer + 360) % 360

    // 增加随机圈数
    const spins = 5 + Math.floor(Math.random() * 6)
    delta += spins * 360

    const targetRotation = this.data.currentRotation + delta

    this.setData({
      targetRotation,
      animActive: true,
      transitionDuration: '3s',
      currentRotation: targetRotation,
      result: ''
    }, () => {
      this.updateRotatorStyle()
    })
  },

  // 动画结束处理
  onTransitionEnd() {
    if (!this.data.animActive) return

    this.setData({ animActive: false })
    this.calculateResult()

    // 归一化角度
    setTimeout(() => {
      this.setData({
        transitionDuration: '0s',
        currentRotation: this.data.currentRotation % 360
      }, () => {
        this.updateRotatorStyle()
      })
    }, 50)
  },

  // 计算结果
  calculateResult() {
    const effectiveRotation = this.data.currentRotation % 360
    let rawAngle = (-effectiveRotation) % 360
    if (rawAngle < 0) rawAngle += 360

    const step = 360 / this.data.options.length
    const index = Math.floor(rawAngle / step) % this.data.options.length
    const selected = this.data.options[index]
    const result = `随机结果为：${selected.label}`

    this.setData({ result })

    wx.showToast({
      title: result,
      icon: 'none',
      duration: 2000
    })
  },

  // 加载预设
  loadPreset(preset) {
    let options = JSON.parse(JSON.stringify(preset.options))

    // 检查是否需要生成颜色
    if (!options[0] || !options[0].color) {
      options = this.generateColors(options)
      // 更新存储
      const presets = getPresets()
      const target = presets.find(p => p.id === preset.id)
      if (target) {
        target.options = options
        savePresets(presets)
      }
    }

    this.setData({
      options,
      currentRotation: 0,
      result: ''
    }, () => {
      // setData 完成后绘制，确保 canvas 已初始化
      this.updateRotatorStyle()
      this.drawWheel()
    })
  },

  // 生成颜色（静态方法，可在未初始化时调用）
  generateColors(options) {
    if (!options || !options.length) return options
    const baseHue = Math.random() * 360
    const hueStep = 360 / options.length
    return options.map((opt, i) => ({
      ...opt,
      color: `hsl(${Math.round((baseHue + i * hueStep) % 360)}, 70%, 60%)`
    }))
  },

  // 跳转到列表页
  goToList() {
    wx.navigateTo({
      url: '/pages/list/list'
    })
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '旋风无敌小转盘',
      path: '/pages/index/index'
    }
  }
})