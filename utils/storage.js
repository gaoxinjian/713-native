/** 存储工具 **/

const STORAGE_KEY = 'presets'

function getPresets() {
  return wx.getStorageSync(STORAGE_KEY) || []
}

function savePresets(presets) {
  wx.setStorageSync(STORAGE_KEY, presets)
}

function getPresetById(id) {
  const presets = getPresets()
  return presets.find(p => p.id === id)
}

function addPreset(preset) {
  const presets = getPresets()
  preset.id = Date.now()
  presets.push(preset)
  savePresets(presets)
  return preset
}

function updatePreset(id, updates) {
  const presets = getPresets()
  const index = presets.findIndex(p => p.id === id)
  if (index !== -1) {
    presets[index] = { ...presets[index], ...updates }
    savePresets(presets)
    return presets[index]
  }
  return null
}

function deletePreset(id) {
  let presets = getPresets()
  presets = presets.filter(p => p.id !== id)
  savePresets(presets)
}

module.exports = {
  getPresets,
  savePresets,
  getPresetById,
  addPreset,
  updatePreset,
  deletePreset
}