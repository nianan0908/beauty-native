App({
  globalData: {
    assistantUser: null,
  },

  onLaunch() {
    this.globalData.assistantUser = wx.getStorageSync("qiguang-assistant-user") || null;
  },

  setAssistantUser(user) {
    this.globalData.assistantUser = user;
    wx.setStorageSync("qiguang-assistant-user", user);
  },

  logoutAssistant() {
    this.globalData.assistantUser = null;
    wx.removeStorageSync("qiguang-assistant-user");
  },
});
