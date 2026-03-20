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
    } else if (this.data.options.length === 0) {
      // 首次加载且没有数据时，使用默认预设
      let presets = getPresets()
      if (presets.length === 0) {
        // 没有预设时，创建默认预设
        presets = [this.createDefaultPreset()]
        savePresets(presets)
      }
      this.loadPreset(presets[0])
    }
    // 如果已经有数据（options.length > 0）且没有新选择的预设，保持当前转盘不变
  },

  // 创建默认预设
  createDefaultPreset() {
    const defaultOptions = [
      { label: '火锅', probability: null },
      { label: '烧烤', probability: null },
      { label: '日料', probability: null },
      { label: '韩餐', probability: null },
      { label: '川菜', probability: null },
      { label: '粤菜', probability: null }
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

  // 获取选项的概率（百分比转小数）
  getOptionProbabilities() {
    const options = this.data.options
    const totalOptions = options.length

    // 检查是否有自定义概率
    const hasCustomProb = options.some(opt =>
      opt.probability !== null &&
      opt.probability !== undefined &&
      !isNaN(opt.probability) &&
      opt.probability > 0
    )

    if (!hasCustomProb) {
      // 平均分配
      return options.map(() => 1 / totalOptions)
    }

    // 计算自定义概率总和
    let customSum = 0
    let customCount = 0
    options.forEach(opt => {
      if (opt.probability !== null && opt.probability !== undefined && !isNaN(opt.probability)) {
        customSum += opt.probability
        customCount++
      }
    })

    // 剩余概率平均分配给未设置的选项
    const remainingOptions = totalOptions - customCount
    const remainingProb = remainingOptions > 0 ? (100 - customSum) / remainingOptions / 100 : 0

    return options.map(opt => {
      if (opt.probability !== null && opt.probability !== undefined && !isNaN(opt.probability)) {
        return opt.probability / 100
      }
      return remainingProb
    })
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
    const probabilities = this.getOptionProbabilities()

    ctx.clearRect(0, 0, size, size)

    let currentAngle = -Math.PI / 2 // 从顶部开始

    options.forEach((item, index) => {
      const prob = probabilities[index]
      const angleSize = prob * 2 * Math.PI // 概率对应的角度大小
      const start = currentAngle
      const end = currentAngle + angleSize

      // 绘制扇形
      ctx.beginPath()
      ctx.moveTo(center, center)
      ctx.arc(center, center, radius, start, end)
      ctx.closePath()
      ctx.fillStyle = item.color
      ctx.fill()

      // 在扇形中央绘制文字
      const midAngle = start + angleSize / 2
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

      currentAngle = end
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

    const probabilities = this.getOptionProbabilities()

    // 根据概率随机选择目标选项
    const random = Math.random()
    let cumulativeProb = 0
    let targetIndex = 0
    for (let i = 0; i < probabilities.length; i++) {
      cumulativeProb += probabilities[i]
      if (random <= cumulativeProb) {
        targetIndex = i
        break
      }
    }

    // 计算目标选项的角度范围
    let startAngle = 0
    for (let i = 0; i < targetIndex; i++) {
      startAngle += probabilities[i] * 360
    }
    const endAngle = startAngle + probabilities[targetIndex] * 360

    // 在目标选项范围内随机选择一个角度（避开边界）
    const threshold = 2 // 边界阈值
    const range = endAngle - startAngle
    let targetPointer = startAngle + threshold + Math.random() * (range - 2 * threshold)
    targetPointer = (targetPointer + 360) % 360

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

    const probabilities = this.getOptionProbabilities()

    // 根据概率计算当前角度对应的选项
    let cumulativeAngle = 0
    let index = 0
    for (let i = 0; i < probabilities.length; i++) {
      const angleSize = probabilities[i] * 360
      if (rawAngle >= cumulativeAngle && rawAngle < cumulativeAngle + angleSize) {
        index = i
        break
      }
      cumulativeAngle += angleSize
    }

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
      label: opt.label,
      probability: opt.probability !== undefined ? opt.probability : null,
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