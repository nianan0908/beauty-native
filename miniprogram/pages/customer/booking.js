const customerData = require("../../services/customer-data");

Page({
  data: { step: 1, store: null, services: [], selectedService: null, employees: [], dates: [], times: ["09:30", "10:30", "11:30", "13:30", "14:30", "15:30", "16:30", "17:30"], coupons: [], serviceId: "", employeeId: "", date: "", time: "10:30", couponId: "", note: "", price: 0, originalPrice: 0, activity: null, created: null },

  onLoad(options) {
    const state = customerData.getState();
    const storeId = options.storeId || state.selectedStoreId;
    const store = customerData.stores.find((item) => item.id === storeId) || customerData.stores[0];
    const services = customerData.services.filter((item) => item.storeIds.includes(store.id)).map((item) => ({ ...item, initial: item.category.substring(0, 1) }));
    const serviceId = options.serviceId && services.some((item) => item.id === options.serviceId) ? options.serviceId : services[0].id;
    const activity = options.activityId ? customerData.activities.find((item) => item.id === options.activityId) || null : null;
    const dates = customerData.bookingDates();
    this.setData({ store, services, serviceId, activity, dates, date: dates[0].value });
    this.refreshSelection();
  },

  refreshSelection() {
    const service = this.data.services.find((item) => item.id === this.data.serviceId);
    const state = customerData.getState();
    const employees = customerData.employees.filter((item) => item.storeId === this.data.store.id && item.serviceIds.includes(service.id));
    const coupons = customerData.coupons.filter((item) => state.claimedCouponIds.includes(item.id) && !state.usedCouponIds.includes(item.id) && item.storeIds.includes(this.data.store.id) && item.serviceIds.includes(service.id));
    const activity = this.data.activity && this.data.activity.serviceId === service.id ? this.data.activity : null;
    const selectedCoupon = coupons.find((item) => item.id === this.data.couponId);
    const originalPrice = activity ? activity.originalPrice : service.price;
    const price = activity ? activity.price : Math.max(0, service.price - (selectedCoupon ? selectedCoupon.discount : 0));
    this.setData({ selectedService: service, employees, employeeId: employees.some((item) => item.id === this.data.employeeId) ? this.data.employeeId : employees[0].id, coupons, couponId: selectedCoupon ? selectedCoupon.id : "", originalPrice, price });
  },
  selectService(event) { this.setData({ serviceId: event.currentTarget.dataset.id, couponId: "", activity: null }); this.refreshSelection(); },
  selectEmployee(event) { this.setData({ employeeId: event.currentTarget.dataset.id }); },
  selectDate(event) { this.setData({ date: event.currentTarget.dataset.value }); },
  selectTime(event) { this.setData({ time: event.currentTarget.dataset.value }); },
  selectCoupon(event) { this.setData({ couponId: event.currentTarget.dataset.id }); this.refreshSelection(); },
  inputNote(event) { this.setData({ note: event.detail.value }); },
  next() { if (this.data.step < 3) this.setData({ step: this.data.step + 1 }); else this.submit(); },
  previous() { if (this.data.step > 1) this.setData({ step: this.data.step - 1 }); else wx.navigateBack(); },
  submit() {
    const created = customerData.createBooking({ storeId: this.data.store.id, serviceId: this.data.serviceId, employeeId: this.data.employeeId, date: this.data.date, time: this.data.time, couponId: this.data.couponId, price: this.data.price, note: this.data.note });
    this.setData({ created, step: 4 });
  },
  goHome() { wx.navigateBack(); },
  goProfile() { wx.redirectTo({ url: "/pages/customer/profile?tab=appointments" }); },
});
