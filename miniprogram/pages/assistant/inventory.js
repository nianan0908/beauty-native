const api = require("../../services/api");

Page({
  data: { user: null, stocks: [], transactions: [], requestTypes: ["额外领用", "退回", "报损"], tab: "stock", requestOpen: false, selectedStock: null, requestType: "额外领用", quantity: 1, reason: "" },
  onLoad(options) {
    const user = getApp().globalData.assistantUser;
    if (!user) { wx.redirectTo({ url: "/pages/assistant/login" }); return; }
    this.setData({ user, tab: user.role === "employee" ? "records" : "stock" });
    this.loadData().then(() => { if (options.action === "request") this.openRequest(); });
  },
  onPullDownRefresh() { this.loadData().finally(() => wx.stopPullDownRefresh()); },
  async loadData() {
    try {
      const [stocks, transactions] = await Promise.all([api.stocks(this.data.user), api.transactions(this.data.user)]);
      const normalizedStocks = stocks.map((item) => ({ ...item, stockKey: `${item.store_id}-${item.consumable_id}`, initial: item.name.substring(0, 1), low: Number(item.quantity) <= Number(item.safety_stock) }));
      this.setData({ stocks: normalizedStocks, transactions });
    } catch (error) { wx.showToast({ title: error.message || "加载失败", icon: "none" }); }
  },
  changeTab(event) { this.setData({ tab: event.currentTarget.dataset.tab }); },
  openRequest() { this.setData({ requestOpen: true, selectedStock: this.data.stocks[0] || null, quantity: 1, reason: "" }); },
  closeRequest() { this.setData({ requestOpen: false }); },
  selectStock(event) { this.setData({ selectedStock: this.data.stocks[Number(event.detail.value)] }); },
  selectType(event) { this.setData({ requestType: ["额外领用", "退回", "报损"][Number(event.detail.value)] }); },
  inputQuantity(event) { this.setData({ quantity: Number(event.detail.value) }); },
  inputReason(event) { this.setData({ reason: event.detail.value }); },
  async submitRequest() {
    if (!this.data.selectedStock || this.data.quantity <= 0 || this.data.reason.trim().length < 2) { wx.showToast({ title: "请完整填写申请信息", icon: "none" }); return; }
    await api.submitInventoryRequest(this.data.user, { store_id: this.data.user.storeId, consumable_id: this.data.selectedStock.consumable_id, type: this.data.requestType, quantity: this.data.quantity, reason: this.data.reason });
    this.setData({ requestOpen: false, tab: "records" });
    await this.loadData();
    wx.showToast({ title: "已提交店长审批", icon: "success" });
  },
});
