const customerData = require("../../services/customer-data");

Page({
  data: { state: null, coupons: [], tab: "coupons", selectedOrder: null },
  onShow() { this.loadData(); },
  loadData() {
    const state = customerData.getState();
    const coupons = customerData.coupons.map((item) => ({ ...item, claimed: state.claimedCouponIds.includes(item.id), used: state.usedCouponIds.includes(item.id) }));
    this.setData({ state, coupons });
  },
  changeTab(event) { this.setData({ tab: event.currentTarget.dataset.tab, selectedOrder: null }); },
  claimCoupon(event) { customerData.claimCoupon(event.currentTarget.dataset.id); this.loadData(); wx.showToast({ title: "领取成功", icon: "success" }); },
  openOrder(event) { this.setData({ selectedOrder: this.data.state.orders.find((item) => item.id === event.currentTarget.dataset.id) }); },
  closeOrder() { this.setData({ selectedOrder: null }); },
  goBooking() { wx.navigateTo({ url: "/pages/customer/booking" }); },
});
