Page({
  openCustomer() {
    wx.navigateTo({ url: "/pages/customer/index?page=首页" });
  },

  openAssistant() {
    const app = getApp();
    wx.navigateTo({
      url: app.globalData.assistantUser
        ? "/pages/assistant/dashboard"
        : "/pages/assistant/login",
    });
  },
});
