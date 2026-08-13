const api = require("../../services/api");

Page({
  data: { user: null, metrics: null, appointments: [], loading: true },

  onLoad() { this.ensureUser(); },
  onShow() { if (this.data.user) this.loadData(); },
  onPullDownRefresh() { this.loadData().finally(() => wx.stopPullDownRefresh()); },

  ensureUser() {
    const user = getApp().globalData.assistantUser;
    if (!user) { wx.redirectTo({ url: "/pages/assistant/login" }); return; }
    this.setData({ user });
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const [metrics, appointments] = await Promise.all([api.dashboard(this.data.user), api.appointments(this.data.user)]);
      this.setData({ metrics, appointments, loading: false });
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({ title: error.message || "加载失败", icon: "none" });
    }
  },

  openWork() { wx.navigateTo({ url: "/pages/assistant/work" }); },
  openInventory() { wx.navigateTo({ url: "/pages/assistant/inventory" }); },
  openApprovals() { wx.navigateTo({ url: "/pages/assistant/approvals" }); },
  switchRole() { getApp().logoutAssistant(); wx.redirectTo({ url: "/pages/assistant/login" }); },
});
