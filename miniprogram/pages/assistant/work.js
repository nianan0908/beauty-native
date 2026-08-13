const api = require("../../services/api");

Page({
  data: { user: null, appointments: [] },
  onLoad() {
    const user = getApp().globalData.assistantUser;
    if (!user) { wx.redirectTo({ url: "/pages/assistant/login" }); return; }
    this.setData({ user });
    api.appointments(user).then((appointments) => this.setData({ appointments: appointments.map((item) => ({ ...item, customerInitial: item.customer.substring(0, 1) })) }));
  },
  openInventory() { wx.navigateTo({ url: "/pages/assistant/inventory?action=request" }); },
  updateStatus(event) {
    const id = event.currentTarget.dataset.id;
    const appointments = this.data.appointments.map((item) => item.id === id ? { ...item, status: item.status === "已确认" ? "服务中" : "已完成" } : item);
    this.setData({ appointments });
    wx.showToast({ title: "服务状态已更新", icon: "success" });
  },
});
