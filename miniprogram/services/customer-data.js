const STORAGE_KEY = "meitian-native-customer-state-v1";

const stores = [
  { id: "MS001", name: "云锦路店", shortAddress: "静安区云锦路 188 号", address: "上海市静安区云锦路 188 号", distance: "0.8km", rating: "4.9", hours: "09:30 - 21:00", tags: ["皮肤管理", "环境安静", "可停车"], serviceIds: ["S001", "S002", "S004"] },
  { id: "MS006", name: "湖滨路店", shortAddress: "徐汇区湖滨路 66 号", address: "上海市徐汇区湖滨路 66 号", distance: "3.6km", rating: "4.8", hours: "10:00 - 20:30", tags: ["手部护理", "社区门店", "环境舒适"], serviceIds: ["S001", "S003", "S004"] },
];

const services = [
  { id: "S001", name: "水光焕肤护理", category: "面部护理", duration: 60, price: 298, storeIds: ["MS001", "MS006"], description: "改善干燥暗沉，补充肌肤水分" },
  { id: "S002", name: "肩颈舒缓 SPA", category: "身体舒缓", duration: 75, price: 368, storeIds: ["MS001"], description: "缓解肩颈紧绷与久坐疲劳" },
  { id: "S003", name: "轻奢手部护理", category: "手部护理", duration: 45, price: 168, storeIds: ["MS006"], description: "手部清洁、养护与深润手膜" },
  { id: "S004", name: "深层清洁护理", category: "面部护理", duration: 60, price: 258, storeIds: ["MS001", "MS006"], description: "清洁毛孔、黑头和多余油脂" },
];

const employees = [
  { id: "E001", name: "苏禾", initial: "苏", title: "资深美容师", storeId: "MS001", serviceIds: ["S001", "S002"] },
  { id: "E002", name: "孟然", initial: "孟", title: "SPA 理疗师", storeId: "MS001", serviceIds: ["S002"] },
  { id: "E003", name: "周琳", initial: "周", title: "皮肤管理师", storeId: "MS001", serviceIds: ["S001", "S004"] },
  { id: "E005", name: "叶晨", initial: "叶", title: "美容护理师", storeId: "MS006", serviceIds: ["S001", "S003", "S004"] },
];

const activities = [
  { id: "ACT001", type: "限时秒杀", title: "水光焕肤限时秒杀", subtitle: "每日限量 12 份", serviceId: "S001", storeId: "MS001", price: 99, originalPrice: 298 },
  { id: "ACT002", type: "节日活动", title: "七夕双人焕亮计划", subtitle: "两人同行，第二位半价", serviceId: "S001", storeId: "MS001", price: 398, originalPrice: 596 },
  { id: "ACT003", type: "会员活动", title: "湖滨轻奢手护季", subtitle: "会员预约赠手膜护理", serviceId: "S003", storeId: "MS006", price: 128, originalPrice: 168 },
];

const coupons = [
  { id: "QG-C001", title: "会员护理满减券", description: "面部护理满 258 元可用", valueText: "¥30", condition: "满 ¥258 可用", validUntil: "2026-08-31", serviceIds: ["S001", "S004"], storeIds: ["MS001", "MS006"], discount: 30 },
  { id: "QG-C002", title: "肩颈舒缓专享券", description: "云锦路店肩颈项目立减 50 元", valueText: "¥50", condition: "满 ¥368 可用", validUntil: "2026-09-10", serviceIds: ["S002"], storeIds: ["MS001"], discount: 50 },
  { id: "QG-C003", title: "轻奢手护九折券", description: "湖滨路店轻奢手部护理可用", valueText: "9折", condition: "无门槛", validUntil: "2026-09-10", serviceIds: ["S003"], storeIds: ["MS006"], discount: 17 },
];

const initialState = {
  customer: { id: "C001", name: "周小姐", initial: "周", phone: "139****2026", level: "金卡会员", visits: 18, totalSpend: 5280 },
  selectedStoreId: "MS001",
  claimedCouponIds: ["QG-C001", "QG-C003"],
  usedCouponIds: [],
  cards: [
    { id: "CC001", name: "焕肤护理 5 次卡", service: "水光焕肤护理", remainingTimes: 3, totalTimes: 5, expiresAt: "2026-11-30", status: "使用中" },
    { id: "CC002", name: "肩颈舒缓 10 次卡", service: "肩颈舒缓 SPA", remainingTimes: 6, totalTimes: 10, expiresAt: "2027-04-12", status: "使用中" },
  ],
  appointments: [
    { id: "A-UPCOMING", storeId: "MS001", store: "云锦路店", serviceId: "S001", service: "水光焕肤护理", employeeId: "E001", employee: "苏禾", date: "2026-08-15", dateLabel: "8月15日", time: "10:30", duration: 60, price: 298, status: "已确认", note: "" },
    { id: "A-HISTORY", storeId: "MS001", store: "云锦路店", serviceId: "S002", service: "肩颈舒缓 SPA", employeeId: "E001", employee: "苏禾", date: "2026-08-12", dateLabel: "8月12日", time: "15:00", duration: 75, price: 368, status: "已完成", note: "" },
  ],
  orders: [
    { id: "O26081208", service: "肩颈舒缓 SPA", store: "云锦路店", employee: "苏禾", amount: 368, payable: 0, paymentMethod: "次卡", status: "已完成", createdAt: "2026-08-12 16:18" },
    { id: "O26080103", service: "水光焕肤护理", store: "云锦路店", employee: "周琳", amount: 298, payable: 268, paymentMethod: "微信", status: "已完成", createdAt: "2026-08-01 11:30" },
  ],
  messages: [
    { id: "MSG001", type: "优惠到期", title: "会员护理满减券即将到期", content: "你的 30 元护理券将在 8 月 31 日到期。", createdAt: "今天 10:20", read: false },
    { id: "MSG002", type: "活动提醒", title: "云锦路店秒杀正在进行", content: "水光焕肤护理限时 99 元，今日剩余 12 份。", createdAt: "今天 09:58", read: false },
    { id: "MSG003", type: "预约提醒", title: "明日护理预约已确认", content: "8 月 15 日 10:30，云锦路店为你保留服务时间。", createdAt: "昨天 18:30", read: true },
  ],
};

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function loadState() { return wx.getStorageSync(STORAGE_KEY) || clone(initialState); }
function saveState(state) { wx.setStorageSync(STORAGE_KEY, state); return state; }
function update(mutator) { const state = loadState(); mutator(state); return saveState(state); }
function findStore(id) { return stores.find((item) => item.id === id) || stores[0]; }
function bookingDates() { return [
  { value: "2026-08-15", week: "周六", day: "15", label: "8月15日" },
  { value: "2026-08-16", week: "周日", day: "16", label: "8月16日" },
  { value: "2026-08-17", week: "周一", day: "17", label: "8月17日" },
  { value: "2026-08-18", week: "周二", day: "18", label: "8月18日" },
  { value: "2026-08-19", week: "周三", day: "19", label: "8月19日" },
]; }

function createBooking(input) {
  let created;
  update((state) => {
    const store = findStore(input.storeId);
    const service = services.find((item) => item.id === input.serviceId);
    const employee = employees.find((item) => item.id === input.employeeId);
    const date = bookingDates().find((item) => item.value === input.date);
    created = { id: `A${Date.now()}`, storeId: store.id, store: store.name, serviceId: service.id, service: service.name, employeeId: employee.id, employee: employee.name, date: input.date, dateLabel: date.label, time: input.time, duration: service.duration, price: input.price, originalPrice: service.price, couponId: input.couponId || "", status: "待确认", note: input.note || "" };
    state.appointments.unshift(created);
    state.selectedStoreId = store.id;
    state.messages.unshift({ id: `MSG${Date.now()}`, type: "预约提醒", title: "预约已提交", content: `${date.label} ${input.time} · ${service.name}，等待门店确认。`, createdAt: "刚刚", read: false });
  });
  return created;
}

module.exports = {
  stores, services, employees, activities, coupons, bookingDates,
  getState: loadState,
  setSelectedStore(storeId) { return update((state) => { state.selectedStoreId = storeId; }); },
  claimCoupon(couponId) { return update((state) => { if (!state.claimedCouponIds.includes(couponId)) state.claimedCouponIds.push(couponId); }); },
  cancelAppointment(id) { return update((state) => { state.appointments = state.appointments.map((item) => item.id === id && ["待确认", "已确认"].includes(item.status) ? { ...item, status: "已取消" } : item); }); },
  markMessageRead(id) { return update((state) => { state.messages = state.messages.map((item) => item.id === id ? { ...item, read: true } : item); }); },
  markAllMessagesRead() { return update((state) => { state.messages = state.messages.map((item) => ({ ...item, read: true })); }); },
  createBooking,
};
