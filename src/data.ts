import type { AfterSale, Appointment, CardProduct, CardTransaction, Customer, CustomerCard, CustomerMessage, DemoUser, EmployeeItem, MarketingActivity, MarketplaceStore, Order, PlatformAuditLog, PromotionCoupon, Role, SaaSPlan, ServiceItem, StaffMember, StaffSchedule, StoreInfo, Tenant } from "./types";
import { addDays, DEMO_CONTEXT, DEMO_TODAY } from "./demo-context";

export const demoUsers: DemoUser[] = [
  { role: "owner", username: "boss", password: "demo123", name: "林知夏", title: "商家老板", description: "查看全部门店经营与团队表现", entityId: "OWNER001", merchantId: DEMO_CONTEXT.merchantId },
  { role: "manager", username: "manager", password: "demo123", name: "陈妍", title: "门店店长", description: "处理预约、会员与日常经营", entityId: "E004", merchantId: DEMO_CONTEXT.merchantId, storeId: DEMO_CONTEXT.defaultStoreId },
  { role: "receptionist", username: "reception", password: "demo123", name: "张悦", title: "门店前台", description: "代客预约、到店接待、收银与核销", entityId: "R001", merchantId: DEMO_CONTEXT.merchantId, storeId: DEMO_CONTEXT.defaultStoreId },
  { role: "employee", username: "staff", password: "demo123", name: DEMO_CONTEXT.employeeName, title: "服务员工", description: "查看日程并完成顾客服务", entityId: DEMO_CONTEXT.employeeId, merchantId: DEMO_CONTEXT.merchantId, storeId: DEMO_CONTEXT.defaultStoreId },
  { role: "customer", username: "customer", password: "demo123", name: DEMO_CONTEXT.customerName, title: "品牌会员", description: "预约栖光门店服务并管理会员权益", entityId: DEMO_CONTEXT.customerId, merchantId: DEMO_CONTEXT.merchantId },
  { role: "platform", username: "admin", password: "demo123", name: "平台运营", title: "平台管理员", description: "管理商家、套餐与平台运营" },
];

export const roleLabels: Record<Role, string> = {
  owner: "老板",
  manager: "店长",
  receptionist: "前台",
  employee: "员工",
  customer: "品牌会员",
  platform: "平台管理员",
};

export const appointments: Appointment[] = [
  { id: "A1028", merchantId: "T001", storeId: "MS001", customerId: "C002", serviceId: "S001", employeeId: "E001", date: "2026-08-13", time: "09:30", customer: "顾女士", phone: "138****1028", service: "水光焕肤护理", employee: "苏禾", store: "云锦路店", duration: 60, price: 298, status: "已完成" },
  { id: "A1029", merchantId: "T001", storeId: "MS001", customerId: "C003", serviceId: "S002", employeeId: "E002", date: "2026-08-13", time: "11:00", customer: "宋女士", phone: "136****2886", service: "肩颈舒缓 SPA", employee: "孟然", store: "云锦路店", duration: 75, price: 368, status: "服务中" },
  { id: "A1030", merchantId: "T001", storeId: "MS001", customerId: "C004", serviceId: "S003", employeeId: "E001", date: "2026-08-13", time: "14:00", customer: "陈女士", phone: "159****6301", service: "轻奢手部护理", employee: "苏禾", store: "云锦路店", duration: 45, price: 168, status: "待确认" },
  { id: "A1031", merchantId: "T001", storeId: "MS001", customerId: "C005", serviceId: "S004", employeeId: "E003", date: "2026-08-13", time: "16:30", customer: "林女士", phone: "137****9520", service: "深层清洁护理", employee: "周琳", store: "云锦路店", duration: 60, price: 258, status: "已确认" },
  { id: "A1022", merchantId: "T001", storeId: "MS001", customerId: "C001", serviceId: "S002", employeeId: "E001", date: "2026-08-12", time: "15:00", customer: "周小姐", phone: "139****2026", service: "肩颈舒缓 SPA", employee: "苏禾", store: "云锦路店", duration: 75, price: 368, status: "已完成" },
];

export const services: ServiceItem[] = [
  { id: "S001", merchantId: "T001", storeIds: ["MS001", "MS006"], isOnline: true, bookingEnabled: true, category: "面部护理", name: "水光焕肤护理", duration: 60, price: 298, tone: "service-green", consumables: [{ consumableId: "M001", quantity: 1 }, { consumableId: "M002", quantity: 10 }, { consumableId: "M003", quantity: 4 }, { consumableId: "M006", quantity: 1 }] },
  { id: "S002", merchantId: "T001", storeIds: ["MS001"], isOnline: true, bookingEnabled: true, category: "身体舒缓", name: "肩颈舒缓 SPA", duration: 75, price: 368, tone: "service-coral", consumables: [{ consumableId: "M004", quantity: 25 }, { consumableId: "M003", quantity: 2 }, { consumableId: "M006", quantity: 1 }] },
  { id: "S003", merchantId: "T001", storeIds: ["MS006"], isOnline: true, bookingEnabled: true, category: "手部护理", name: "轻奢手部护理", duration: 45, price: 168, tone: "service-blue", consumables: [{ consumableId: "M007", quantity: 1 }, { consumableId: "M006", quantity: 1 }] },
  { id: "S004", merchantId: "T001", storeIds: ["MS001", "MS006"], isOnline: true, bookingEnabled: true, category: "面部护理", name: "深层清洁护理", duration: 60, price: 258, tone: "service-gold", consumables: [{ consumableId: "M005", quantity: 20 }, { consumableId: "M003", quantity: 6 }, { consumableId: "M006", quantity: 1 }] },
  { id: "S005", merchantId: "T003", storeIds: ["MS003"], isOnline: true, bookingEnabled: true, category: "皮肤管理", name: "敏感肌修护管理", duration: 70, price: 328, tone: "service-blue" },
  { id: "S006", merchantId: "T005", storeIds: ["MS005"], isOnline: true, bookingEnabled: true, category: "美甲美睫", name: "日式裸透美甲", duration: 90, price: 228, tone: "service-coral" },
  { id: "S007", merchantId: "T005", storeIds: ["MS005"], isOnline: true, bookingEnabled: true, category: "美甲美睫", name: "自然款睫毛嫁接", duration: 100, price: 298, tone: "service-gold" },
  { id: "S008", merchantId: "T004", storeIds: ["MS004"], isOnline: true, bookingEnabled: true, category: "身体舒缓", name: "芳香精油全身 SPA", duration: 90, price: 468, tone: "service-green" },
];

export const employees: EmployeeItem[] = [
  { id: "E001", name: "苏禾", title: "资深美容师", rating: "4.9", serviceIds: ["S001", "S002"] },
  { id: "E002", name: "孟然", title: "SPA 理疗师", rating: "4.8", serviceIds: ["S002"] },
  { id: "E003", name: "周琳", title: "皮肤管理师", rating: "4.9", serviceIds: ["S001", "S004"] },
  { id: "E005", name: "叶晨", title: "美容护理师", rating: "4.8", serviceIds: ["S003"] },
  { id: "E006", name: "叶茉", title: "高级美容顾问", rating: "4.8", serviceIds: ["S001", "S004"] },
  { id: "E007", name: "沈云", title: "问题肌管理师", rating: "4.9", serviceIds: ["S004", "S005"] },
  { id: "E008", name: "安然", title: "芳疗师", rating: "4.9", serviceIds: ["S002", "S008"] },
  { id: "E009", name: "小简", title: "日式美甲师", rating: "4.8", serviceIds: ["S003", "S006"] },
  { id: "E010", name: "可欣", title: "美睫师", rating: "4.7", serviceIds: ["S007"] },
];

export const marketplaceCategories = ["全部", "面部护理", "皮肤管理", "身体 SPA", "美甲美睫"];

export const marketplaceStores: MarketplaceStore[] = [
  {
    id: "MS001", merchantId: "T001", merchantName: "栖光美学", name: "云锦路店", category: "面部护理",
    coverImage: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1000&q=82",
    rating: 4.9, reviewCount: 826, distance: 0.8, address: "上海市静安区云锦路 188 号", businessHours: "09:30 - 21:00",
    tags: ["皮肤管理", "环境安静", "可停车"], serviceIds: ["S001", "S002", "S004"], employeeIds: ["E001", "E002", "E003"],
    promotion: "新客护理项目 8 折", featured: true,
  },
  {
    id: "MS006", merchantId: "T001", merchantName: "栖光美学", name: "湖滨路店", category: "综合护理",
    coverImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=82",
    rating: 4.8, reviewCount: 426, distance: 3.6, address: "上海市徐汇区湖滨路 66 号", businessHours: "10:00 - 20:30",
    tags: ["手部护理", "社区门店", "环境舒适"], serviceIds: ["S001", "S003", "S004"], employeeIds: ["E005", "E003"],
    promotion: "会员手部护理 9 折", featured: true,
  },
  {
    id: "MS002", merchantId: "T002", merchantName: "MOMO 美研社", name: "静安嘉里店", category: "面部护理",
    coverImage: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1000&q=82",
    rating: 4.8, reviewCount: 1064, distance: 1.2, address: "上海市静安区南京西路 1515 号", businessHours: "10:00 - 22:00",
    tags: ["人气门店", "商场内", "晚间营业"], serviceIds: ["S001", "S004", "S005"], employeeIds: ["E006", "E007"],
    promotion: "首单立减 50 元", featured: true,
  },
  {
    id: "MS003", merchantId: "T003", merchantName: "云肌护理中心", name: "陕西南路店", category: "皮肤管理",
    coverImage: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1000&q=82",
    rating: 4.9, reviewCount: 539, distance: 1.7, address: "上海市黄浦区陕西南路 122 号", businessHours: "10:00 - 20:30",
    tags: ["敏感肌专研", "一对一咨询", "独立包间"], serviceIds: ["S004", "S005"], employeeIds: ["E007", "E003"],
    promotion: "免费肌肤检测", featured: true,
  },
  {
    id: "MS004", merchantId: "T004", merchantName: "南枝 SPA", name: "新天地店", category: "身体 SPA",
    coverImage: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=82",
    rating: 4.8, reviewCount: 742, distance: 2.3, address: "上海市黄浦区马当路 245 号", businessHours: "11:00 - 23:00",
    tags: ["专业芳疗", "双人房", "夜间可约"], serviceIds: ["S002", "S008"], employeeIds: ["E008", "E002"],
    promotion: "工作日午间 85 折",
  },
  {
    id: "MS005", merchantId: "T005", merchantName: "简素美甲", name: "武定路店", category: "美甲美睫",
    coverImage: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1000&q=82",
    rating: 4.7, reviewCount: 318, distance: 2.8, address: "上海市静安区武定路 842 号", businessHours: "10:30 - 21:30",
    tags: ["日式美甲", "原创款式", "宠物友好"], serviceIds: ["S003", "S006", "S007"], employeeIds: ["E009", "E010"],
    promotion: "新客美甲 9 折",
  },
];

export const bookingDates = Array.from({ length: 5 }, (_, index) => {
  const value = addDays(DEMO_TODAY, index + 1);
  const date = new Date(`${value}T00:00:00`);
  return { value, week: `周${"日一二三四五六"[date.getDay()]}`, day: value.slice(-2) };
});

export const bookingTimes = ["09:30", "10:30", "11:30", "13:30", "14:30", "15:30", "16:30", "17:30"];

export const promotionCoupons: PromotionCoupon[] = [
  { id: "QG-C001", merchantId: "T001", title: "会员护理满减券", description: "面部护理满 258 元可用", type: "满减券", discountType: "amount", discountValue: 30, minSpend: 258, serviceIds: ["S001", "S004"], storeIds: ["MS001", "MS006"], validFrom: "2026-08-01", validUntil: "2026-08-31", label: "会员回馈" },
  { id: "QG-C002", merchantId: "T001", title: "肩颈舒缓专享券", description: "云锦路店肩颈项目立减 50 元", type: "项目券", discountType: "amount", discountValue: 50, minSpend: 368, serviceIds: ["S002"], storeIds: ["MS001"], validFrom: "2026-08-13", validUntil: "2026-09-10", label: "猜你喜欢" },
  { id: "QG-C003", merchantId: "T001", title: "轻奢手护九折券", description: "湖滨路店轻奢手部护理可用", type: "折扣券", discountType: "percent", discountValue: 0.9, minSpend: 0, serviceIds: ["S003"], storeIds: ["MS006"], validFrom: "2026-08-01", validUntil: "2026-09-10", label: "会员专享" },
  { id: "QG-C004", merchantId: "T001", title: "七夕同行礼券", description: "七夕双人焕亮项目满 398 元减 60 元", type: "满减券", discountType: "amount", discountValue: 60, minSpend: 398, serviceIds: ["S001"], storeIds: ["MS001"], validFrom: "2026-08-15", validUntil: "2026-08-31", label: "限时领取" },
];

export const marketingActivities: MarketingActivity[] = [
  { id: "ACT001", merchantId: "T001", type: "秒杀", title: "水光焕肤限时秒杀", subtitle: "每日 10:00 限量开抢", serviceId: "S001", price: 99, originalPrice: 298, storeId: "MS001", startAt: "2026-08-13", endAt: "2026-08-13", stock: 12, detail: ["每位会员限购 1 次", "购买后 30 天内到店使用", "不可与其他优惠同时使用"], status: "进行中" },
  { id: "ACT002", merchantId: "T001", type: "节日活动", title: "七夕双人焕亮计划", subtitle: "两人同行，第二位半价", serviceId: "S001", price: 398, originalPrice: 596, storeId: "MS001", startAt: "2026-08-15", endAt: "2026-08-31", coverImage: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=82", detail: ["适用于云锦路店", "需提前 1 天预约", "双人项目需同时到店使用"], status: "未开始" },
  { id: "ACT003", merchantId: "T001", type: "会员活动", title: "湖滨轻奢手护季", subtitle: "会员预约赠手膜护理", serviceId: "S003", price: 128, originalPrice: 168, storeId: "MS006", startAt: "2026-08-01", endAt: "2026-09-10", coverImage: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=82", detail: ["栖光会员专享价格", "赠送深润手膜护理", "活动期间可购买 2 次"], status: "进行中" },
];

export const customerMessages: CustomerMessage[] = [
  { id: "MSG001", type: "优惠到期", title: "会员护理满减券即将到期", content: "你的 30 元护理券将在 8 月 31 日到期，可用于两店面部护理。", createdAt: "今天 10:20", read: false },
  { id: "MSG002", type: "活动提醒", title: "云锦路店秒杀正在进行", content: "水光焕肤护理限时 99 元，今日剩余 12 份。", createdAt: "今天 09:58", read: false },
  { id: "MSG003", type: "预约提醒", title: "到店前为你保留服务时间", content: "预约确认后，我们会在到店前 2 小时再次提醒你。", createdAt: "昨天 18:30", read: true },
];

export const customers: Customer[] = [
  { id: "C001", name: "周小姐", phone: "139****2026", level: "金卡会员", tags: ["高复购", "肩颈护理"], totalSpend: 5280, visits: 18, lastVisit: "2026-08-12", joinedAt: "2025-03-18", note: "偏好安静环境，预约前微信提醒。" },
  { id: "C002", name: "顾女士", phone: "138****1028", level: "银卡会员", tags: ["面部护理"], totalSpend: 2860, visits: 9, lastVisit: "2026-08-13", joinedAt: "2025-11-06" },
  { id: "C003", name: "宋女士", phone: "136****2886", level: "金卡会员", tags: ["SPA", "老客"], totalSpend: 8420, visits: 26, lastVisit: "2026-08-13", joinedAt: "2024-12-20" },
  { id: "C004", name: "陈女士", phone: "159****6301", level: "普通会员", tags: ["新客"], totalSpend: 168, visits: 1, lastVisit: "2026-08-13", joinedAt: "2026-08-13" },
  { id: "C005", name: "林女士", phone: "137****9520", level: "银卡会员", tags: ["皮肤管理"], totalSpend: 3280, visits: 11, lastVisit: "2026-08-02", joinedAt: "2025-07-12" },
];

export const cardProducts: CardProduct[] = [
  { id: "CP001", name: "焕肤护理 5 次卡", service: "水光焕肤护理", totalTimes: 5, price: 1280, validDays: 180, active: true },
  { id: "CP002", name: "肩颈舒缓 10 次卡", service: "肩颈舒缓 SPA", totalTimes: 10, price: 2980, validDays: 365, active: true },
  { id: "CP003", name: "轻奢手护 5 次卡", service: "轻奢手部护理", totalTimes: 5, price: 688, validDays: 180, active: true },
];

export const customerCards: CustomerCard[] = [
  { id: "CC001", customerId: "C001", productId: "CP001", name: "焕肤护理 5 次卡", service: "水光焕肤护理", totalTimes: 5, remainingTimes: 3, purchasedAt: "2026-05-30", expiresAt: "2026-11-30", status: "使用中" },
  { id: "CC002", customerId: "C001", productId: "CP002", name: "肩颈舒缓 10 次卡", service: "肩颈舒缓 SPA", totalTimes: 10, remainingTimes: 6, purchasedAt: "2026-04-12", expiresAt: "2027-04-12", status: "使用中" },
  { id: "CC003", customerId: "C003", productId: "CP002", name: "肩颈舒缓 10 次卡", service: "肩颈舒缓 SPA", totalTimes: 10, remainingTimes: 2, purchasedAt: "2026-01-18", expiresAt: "2027-01-18", status: "使用中" },
];

export const orders: Order[] = [
  { id: "O26081304", merchantId: "T001", storeId: "MS001", customerId: "C001", serviceId: "S002", employeeId: "E001", customer: "周小姐", service: "肩颈舒缓 SPA", employee: "苏禾", store: "云锦路店", amount: 368, discount: 0, payable: 368, status: "待结算", createdAt: "2026-08-13 16:18" },
  { id: "O26081301", appointmentId: "A1028", merchantId: "T001", storeId: "MS001", customerId: "C002", serviceId: "S001", employeeId: "E001", customer: "顾女士", service: "水光焕肤护理", employee: "苏禾", store: "云锦路店", amount: 298, discount: 0, payable: 298, paymentMethod: "微信", status: "已完成", createdAt: "2026-08-13 09:30", completedAt: "2026-08-13 10:31" },
  { id: "O26081208", appointmentId: "A1022", merchantId: "T001", storeId: "MS001", customerId: "C001", serviceId: "S002", employeeId: "E001", customer: "周小姐", service: "肩颈舒缓 SPA", employee: "苏禾", store: "云锦路店", amount: 368, discount: 0, payable: 0, paymentMethod: "次卡", customerCardId: "CC002", status: "已完成", createdAt: "2026-08-12 15:00", completedAt: "2026-08-12 16:18" },
  { id: "O26081106", merchantId: "T001", storeId: "MS001", customerId: "C003", serviceId: "S004", employeeId: "E003", customer: "宋女士", service: "深层清洁护理", employee: "周琳", store: "云锦路店", amount: 258, discount: 20, payable: 238, paymentMethod: "支付宝", status: "已完成", createdAt: "2026-08-11 14:20", completedAt: "2026-08-11 15:25" },
];

export const afterSales: AfterSale[] = [
  {
    id: "AS26081301",
    orderId: "O26081106",
    merchantId: "T001",
    storeId: "MS001",
    customerId: "C003",
    customer: "宋女士",
    service: "深层清洁护理",
    type: "服务不满意",
    reason: "护理后局部仍有紧绷感，希望门店联系并提供后续处理方案。",
    contact: "136****2886",
    requestedAmount: 238,
    status: "待受理",
    createdAt: "2026-08-13 12:20",
    updatedAt: "2026-08-13 12:20",
    logs: [{ id: "ASL001", actor: "宋女士", action: "提交售后申请", note: "服务不满意", createdAt: "2026-08-13 12:20" }],
  },
];

export const cardTransactions: CardTransaction[] = [
  { id: "CT001", cardId: "CC001", customerId: "C001", type: "购卡", change: 5, balance: 5, note: "购买焕肤护理 5 次卡", createdAt: "2026-05-30 10:16" },
  { id: "CT002", cardId: "CC001", customerId: "C001", type: "核销", change: -1, balance: 4, note: "水光焕肤护理", createdAt: "2026-06-18 15:20" },
  { id: "CT003", cardId: "CC001", customerId: "C001", type: "核销", change: -1, balance: 3, note: "水光焕肤护理", createdAt: "2026-07-22 16:05" },
  { id: "CT004", cardId: "CC002", customerId: "C001", type: "核销", change: -1, balance: 6, orderId: "O26081208", note: "肩颈舒缓 SPA", createdAt: "2026-08-12 16:18" },
];

export const saasPlans: SaaSPlan[] = [
  { id: "P001", name: "基础版", price: 2980, storeLimit: 1, employeeLimit: 10, features: ["预约管理", "会员管理", "次卡核销"], tenantCount: 62, active: true },
  { id: "P002", name: "专业版", price: 5980, storeLimit: 5, employeeLimit: 50, features: ["多门店", "经营报表", "员工绩效", "数据导出"], tenantCount: 48, active: true },
  { id: "P003", name: "连锁版", price: 12800, storeLimit: 30, employeeLimit: 300, features: ["连锁管控", "总部报表", "门店权限", "专属服务"], tenantCount: 18, active: true },
];

export const tenants: Tenant[] = [
  { id: "T001", name: "栖光美学", owner: "林知夏", phone: "138****6802", stores: 2, employees: 18, members: 486, monthlyAppointments: 1286, planId: "P002", status: "正常", expiresAt: "2027-03-31", createdAt: "2025-04-12", lastActiveAt: "2026-08-13 13:20" },
  { id: "T002", name: "MOMO 美研社", owner: "叶茉", phone: "136****4518", stores: 4, employees: 36, members: 920, monthlyAppointments: 2104, planId: "P002", status: "正常", expiresAt: "2027-01-18", createdAt: "2025-01-18", lastActiveAt: "2026-08-13 13:08" },
  { id: "T003", name: "云肌护理中心", owner: "沈云", phone: "159****3806", stores: 1, employees: 8, members: 312, monthlyAppointments: 640, planId: "P001", status: "即将到期", expiresAt: "2026-09-02", createdAt: "2025-09-02", lastActiveAt: "2026-08-13 11:42" },
  { id: "T004", name: "南枝 SPA", owner: "许南枝", phone: "137****9160", stores: 3, employees: 25, members: 706, monthlyAppointments: 1564, planId: "P002", status: "正常", expiresAt: "2027-05-20", createdAt: "2025-05-20", lastActiveAt: "2026-08-13 12:55" },
  { id: "T005", name: "简素美甲", owner: "程简", phone: "135****2274", stores: 1, employees: 6, members: 188, monthlyAppointments: 302, planId: "P001", status: "试用中", expiresAt: "2026-08-27", createdAt: "2026-08-01", lastActiveAt: "2026-08-13 10:18" },
  { id: "T006", name: "悦己生活馆", owner: "蒋悦", phone: "188****7031", stores: 2, employees: 14, members: 428, monthlyAppointments: 886, planId: "P002", status: "已冻结", expiresAt: "2026-07-31", createdAt: "2024-08-12", lastActiveAt: "2026-07-30 16:40" },
];

export const platformAuditLogs: PlatformAuditLog[] = [
  { id: "L001", operator: "平台运营", action: "商家续期", target: "MOMO 美研社", detail: "专业版续期 12 个月", createdAt: "2026-08-13 11:26", risk: "重要" },
  { id: "L002", operator: "平台运营", action: "开通试用", target: "简素美甲", detail: "基础版试用 14 天", createdAt: "2026-08-13 09:42", risk: "普通" },
  { id: "L003", operator: "系统", action: "到期提醒", target: "云肌护理中心", detail: "套餐将在 20 天后到期", createdAt: "2026-08-13 09:00", risk: "普通" },
  { id: "L004", operator: "平台运营", action: "冻结商家", target: "悦己生活馆", detail: "套餐到期且未完成续费", createdAt: "2026-08-01 10:12", risk: "重要" },
];

export const staffMembers: StaffMember[] = [
  { id: "E001", name: "苏禾", phone: "138****5126", title: "资深美容师", role: "员工", storeId: "MS001", services: ["水光焕肤护理", "肩颈舒缓 SPA"], serviceIds: ["S001", "S002"], status: "在职", joinedAt: "2024-06-18", monthlyTarget: 30000 },
  { id: "E002", name: "孟然", phone: "137****8062", title: "SPA 理疗师", role: "员工", storeId: "MS001", services: ["肩颈舒缓 SPA"], serviceIds: ["S002"], status: "在职", joinedAt: "2025-02-12", monthlyTarget: 26000 },
  { id: "E003", name: "周琳", phone: "159****2730", title: "皮肤管理师", role: "员工", storeId: "MS001", services: ["深层清洁护理", "水光焕肤护理"], serviceIds: ["S004", "S001"], status: "在职", joinedAt: "2024-11-03", monthlyTarget: 28000 },
  { id: "E004", name: "陈妍", phone: "136****1985", title: "云锦路店店长", role: "店长", storeId: "MS001", services: ["水光焕肤护理"], serviceIds: ["S001"], status: "在职", joinedAt: "2023-08-20", monthlyTarget: 50000 },
  { id: "R001", name: "张悦", phone: "135****2068", title: "门店前台", role: "前台", storeId: "MS001", services: [], serviceIds: [], status: "在职", joinedAt: "2025-09-08", monthlyTarget: 0 },
  { id: "E005", name: "叶晨", phone: "188****6412", title: "美容师", role: "员工", storeId: "MS006", services: ["轻奢手部护理"], serviceIds: ["S003"], status: "在职", joinedAt: "2026-03-15", monthlyTarget: 18000 },
];

export const stores: StoreInfo[] = [
  { id: "MS001", merchantId: "T001", name: "云锦路店", address: "上海市静安区云锦路 188 号", phone: "021-6888 1026", manager: "陈妍", businessHours: "09:30 - 21:00", status: "营业中", members: 486, employees: 5, monthlyRevenue: 128640 },
  { id: "MS006", merchantId: "T001", name: "湖滨路店", address: "上海市徐汇区湖滨路 66 号", phone: "021-5668 2031", manager: "叶晨", businessHours: "10:00 - 20:30", status: "营业中", members: 218, employees: 1, monthlyRevenue: 68420 },
];

export const staffSchedules: StaffSchedule[] = [
  { id: "SH001", employeeId: "E001", date: "2026-08-13", startTime: "09:30", endTime: "18:30", type: "上班" },
  { id: "SH002", employeeId: "E002", date: "2026-08-13", startTime: "11:00", endTime: "20:00", type: "上班" },
  { id: "SH003", employeeId: "E003", date: "2026-08-13", startTime: "09:30", endTime: "18:30", type: "上班" },
  { id: "SH004", employeeId: "E004", date: "2026-08-13", startTime: "09:30", endTime: "18:30", type: "上班" },
  { id: "SH005", employeeId: "E005", date: "2026-08-13", startTime: "10:00", endTime: "20:30", type: "休息" },
  ...bookingDates.flatMap((date, dateIndex) => [
    { id: `SH${dateIndex + 2}01`, employeeId: "E001", date: date.value, startTime: "09:30", endTime: "18:30", type: "上班" as const },
    { id: `SH${dateIndex + 2}02`, employeeId: "E002", date: date.value, startTime: "11:00", endTime: "20:00", type: "上班" as const },
    { id: `SH${dateIndex + 2}03`, employeeId: "E003", date: date.value, startTime: "09:30", endTime: "18:30", type: "上班" as const },
    { id: `SH${dateIndex + 2}05`, employeeId: "E005", date: date.value, startTime: "10:00", endTime: "20:00", type: dateIndex === 2 ? "休息" as const : "上班" as const },
  ]),
];
