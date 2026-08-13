const api = require("../../services/api");

Page({
  data: { user: null, pending: [], loading: true },
  onLoad() {
    const user = getApp().globalData.assistantUser;
    if (!user || user.role === "employee") { wx.redirectTo({ url: "/pages/assistant/dashboard" }); return; }
    this.setData({ user });
    this.loadData();
  },
  onPullDownRefresh() { this.loadData().finally(() => wx.stopPullDownRefresh()); },
  async loadData() {
    const transactions = await api.transactions(this.data.user, "待审批");
    this.setData({ pending: transactions.filter((item) => item.status === "待审批").map((item) => ({ ...item, employeeInitial: (item.employee_name || "员").substring(0, 1) })), loading: false });
  },
  async approve(event) { await api.approve(this.data.user, event.currentTarget.dataset.id); await this.loadData(); wx.showToast({ title: "已审批通过", icon: "success" }); },
  async reject(event) { await api.reject(this.data.user, event.currentTarget.dataset.id); await this.loadData(); wx.showToast({ title: "已驳回", icon: "none" }); },
});
