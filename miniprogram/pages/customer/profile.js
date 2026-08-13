const customerData = require("../../services/customer-data");

Page({
  data: { state: null, tab: "profile", selectedAppointment: null },
  onLoad(options) { if (options.tab === "appointments") this.setData({ tab: "appointments" }); },
  onShow() { this.setData({ state: customerData.getState() }); },
  openAppointments() { this.setData({ tab: "appointments", selectedAppointment: null }); },
  closeAppointments() { this.setData({ tab: "profile", selectedAppointment: null }); },
  openAppointment(event) { this.setData({ selectedAppointment: this.data.state.appointments.find((item) => item.id === event.currentTarget.dataset.id) }); },
  closeAppointment() { this.setData({ selectedAppointment: null }); },
  cancelAppointment() { customerData.cancelAppointment(this.data.selectedAppointment.id); this.setData({ state: customerData.getState(), selectedAppointment: null }); wx.showToast({ title: "预约已取消", icon: "success" }); },
  goAssets() { wx.navigateTo({ url: "/pages/customer/assets" }); },
  goMessages() { wx.navigateTo({ url: "/pages/customer/messages" }); },
  goBooking() { wx.navigateTo({ url: "/pages/customer/booking" }); },
  backEntry() { wx.navigateBack(); },
  contact() { wx.showModal({ title: "联系美天", content: "云锦路店：021-6888 1026\n湖滨路店：021-5668 2031\n服务时间：09:30 - 21:00", showCancel: false }); },
});
