const customerData = require("../../services/customer-data");

Page({
  data: { messages: [] },
  onShow() { this.loadData(); },
  loadData() { this.setData({ messages: customerData.getState().messages }); },
  read(event) { customerData.markMessageRead(event.currentTarget.dataset.id); this.loadData(); },
  readAll() { customerData.markAllMessagesRead(); this.loadData(); wx.showToast({ title: "已全部标记已读", icon: "success" }); },
});
