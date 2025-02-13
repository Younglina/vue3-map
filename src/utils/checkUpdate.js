// 检查小程序版本更新
export function checkUpdate() {
  if (wx.canIUse('getUpdateManager')) {
    const updateManager = wx.getUpdateManager()
    
    // 检查是否有新版本
    updateManager.onCheckForUpdate(function (res) {
      if (res.hasUpdate) {
        console.log('发现新版本')
      }
    })

    // 新版本下载完成
    updateManager.onUpdateReady(function () {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success: function (res) {
          if (res.confirm) {
            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            updateManager.applyUpdate()
          }
        }
      })
    })

    // 新版本下载失败
    updateManager.onUpdateFailed(function () {
      wx.showModal({
        title: '更新提示',
        content: '新版本下载失败，请检查网络后重试',
        showCancel: false
      })
    })
  } else {
    wx.showModal({
      title: '提示',
      content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。',
      showCancel: false
    })
  }
}
