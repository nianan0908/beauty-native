const customerData = require("../../services/customer-data");

Page({
  data: { state: null, store: null, stores: [], services: [], activities: [], upcoming: null, unreadCount: 0, storePickerOpen: false },

  onLoad() { wx.showShareMenu({ menus: ["shareAppMessage", "shareTimeline"] }); },
  onShow() { this.loadData(); },

  loadData() {
    const state = customerData.getState();
    const store = customerData.stores.find((item) => item.id === state.selectedStoreId) || customerData.stores[0];
    const services = customerData.services.filter((item) => item.storeIds.includes(store.id));
    const activities = customerData.activities.filter((item) => item.storeId === store.id);
    const upcoming = state.appointments.find((item) => ["待确认", "已确认"].includes(item.status)) || null;
    this.setData({ state, store, stores: customerData.stores, services, activities, upcoming, unreadCount: state.messages.filter((item) => !item.read).length });
  },
  openStorePicker() { this.setData({ storePickerOpen: true }); },
  closeStorePicker() { this.setData({ storePickerOpen: false }); },
  selectStore(event) { customerData.setSelectedStore(event.currentTarget.dataset.id); this.setData({ storePickerOpen: false }); this.loadData(); },
  openBooking(event) {
    const dataset = event.currentTarget.dataset;
    const query = [`storeId=${dataset.store || this.data.store.id}`];
    if (dataset.service) query.push(`serviceId=${dataset.service}`);
    if (dataset.activity) query.push(`activityId=${dataset.activity}`);
    wx.navigateTo({ url: `/pages/customer/booking?${query.join("&")}` });
  },
  openAssets() { wx.navigateTo({ url: "/pages/customer/assets" }); },
  openProfile() { wx.navigateTo({ url: "/pages/customer/profile" }); },
  openMessages() { wx.navigateTo({ url: "/pages/customer/messages" }); },
  onShareAppMessage() { return { title: "美天美业 · 品牌会员", path: "/pages/customer/index" }; },
  onShareTimeline() { return { title: "美天美业 · 品牌会员" }; },
});
