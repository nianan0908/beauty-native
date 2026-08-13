export type Role = "platform" | "owner" | "manager" | "receptionist" | "employee" | "customer";

export interface DemoUser {
  role: Role;
  username: string;
  password: string;
  name: string;
  title: string;
  description: string;
  entityId?: string;
  merchantId?: string;
  storeId?: string;
}

export interface Appointment {
  id: string;
  merchantId?: string;
  storeId?: string;
  customerId?: string;
  serviceId?: string;
  employeeId?: string;
  activityId?: string;
  couponId?: string;
  originalPrice?: number;
  discountAmount?: number;
  date: string;
  time: string;
  customer: string;
  phone: string;
  service: string;
  employee: string;
  store: string;
  duration: number;
  price: number;
  note?: string;
  status: AppointmentStatus;
}

export type AppointmentStatus = "待确认" | "已确认" | "已到店" | "服务中" | "已完成" | "已取消" | "未到店";

export interface ServiceItem {
  id: string;
  merchantId?: string;
  storeIds?: string[];
  isOnline?: boolean;
  bookingEnabled?: boolean;
  category: string;
  name: string;
  duration: number;
  price: number;
  tone: string;
}

export interface MarketingActivity {
  id: string;
  merchantId: string;
  type: "秒杀" | "节日活动" | "会员活动";
  title: string;
  subtitle: string;
  serviceId: string;
  price: number;
  originalPrice: number;
  storeId: string;
  startAt: string;
  endAt: string;
  stock?: number;
  coverImage?: string;
  detail: string[];
  status: "进行中" | "未开始" | "已结束" | "已停用";
}

export interface EmployeeItem {
  id: string;
  name: string;
  title: string;
  rating: string;
  serviceIds: string[];
}

export interface MarketplaceStore {
  id: string;
  merchantId: string;
  merchantName: string;
  name: string;
  category: string;
  coverImage: string;
  rating: number;
  reviewCount: number;
  distance: number;
  address: string;
  businessHours: string;
  tags: string[];
  serviceIds: string[];
  employeeIds: string[];
  promotion?: string;
  featured?: boolean;
  status?: "营业中" | "暂停营业";
}

export interface BookingOffer {
  activityId?: string;
  title?: string;
  serviceId: string;
  price: number;
}

export interface PromotionCoupon {
  id: string;
  merchantId: string;
  title: string;
  description: string;
  type: "满减券" | "折扣券" | "项目券";
  discountType: "amount" | "percent";
  discountValue: number;
  minSpend: number;
  serviceIds?: string[];
  storeIds?: string[];
  validFrom: string;
  validUntil: string;
  label: string;
}

export interface CustomerMessage {
  id: string;
  type: "预约提醒" | "优惠到期" | "活动提醒";
  title: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  level: "普通会员" | "银卡会员" | "金卡会员";
  tags: string[];
  totalSpend: number;
  visits: number;
  lastVisit: string;
  joinedAt: string;
  note?: string;
}

export interface CardProduct {
  id: string;
  name: string;
  service: string;
  totalTimes: number;
  price: number;
  validDays: number;
  active: boolean;
}

export interface CustomerCard {
  id: string;
  customerId: string;
  productId: string;
  name: string;
  service: string;
  totalTimes: number;
  remainingTimes: number;
  purchasedAt: string;
  expiresAt: string;
  status: "使用中" | "已用完" | "已过期";
}

export interface CardTransaction {
  id: string;
  cardId: string;
  customerId: string;
  type: "购卡" | "核销" | "调整";
  change: number;
  balance: number;
  orderId?: string;
  note: string;
  createdAt: string;
}

export type PaymentMethod = "微信" | "支付宝" | "现金" | "次卡";
export type OrderStatus = "待结算" | "已完成" | "已退款";

export interface Order {
  id: string;
  appointmentId?: string;
  merchantId?: string;
  storeId?: string;
  serviceId?: string;
  employeeId?: string;
  activityId?: string;
  couponId?: string;
  originalPrice?: number;
  customerId: string;
  customer: string;
  service: string;
  employee: string;
  store: string;
  amount: number;
  discount: number;
  payable: number;
  paymentMethod?: PaymentMethod;
  customerCardId?: string;
  status: OrderStatus;
  createdAt: string;
  completedAt?: string;
}

export type AfterSaleType = "退款申请" | "服务不满意" | "重新服务" | "次卡核销异常" | "预约取消退款" | "其他问题";
export type AfterSaleResolution = "退款" | "重新服务" | "恢复卡次" | "其他补偿";
export type AfterSaleStatus = "待受理" | "处理中" | "待审批" | "待退款" | "待重做" | "待补偿" | "已完成" | "已驳回";

export interface AfterSaleLog {
  id: string;
  actor: string;
  action: string;
  note?: string;
  createdAt: string;
}

export interface AfterSale {
  id: string;
  orderId: string;
  merchantId: string;
  storeId: string;
  customerId: string;
  customer: string;
  service: string;
  type: AfterSaleType;
  reason: string;
  contact: string;
  requestedAmount: number;
  status: AfterSaleStatus;
  resolution?: AfterSaleResolution;
  approvedAmount?: number;
  handler?: string;
  createdAt: string;
  updatedAt: string;
  logs: AfterSaleLog[];
}

export type TenantStatus = "正常" | "试用中" | "即将到期" | "已冻结";

export interface Tenant {
  id: string;
  name: string;
  owner: string;
  phone: string;
  stores: number;
  employees: number;
  members: number;
  monthlyAppointments: number;
  planId: string;
  status: TenantStatus;
  expiresAt: string;
  createdAt: string;
  lastActiveAt: string;
}

export interface SaaSPlan {
  id: string;
  name: string;
  price: number;
  storeLimit: number;
  employeeLimit: number;
  features: string[];
  tenantCount: number;
  active: boolean;
}

export interface PlatformAuditLog {
  id: string;
  operator: string;
  action: string;
  target: string;
  detail: string;
  createdAt: string;
  risk: "普通" | "重要";
}

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  title: string;
  role: "店长" | "前台" | "员工";
  storeId: string;
  services: string[];
  serviceIds: string[];
  status: "在职" | "停用";
  joinedAt: string;
  monthlyTarget: number;
}

export interface StoreInfo {
  id: string;
  merchantId: string;
  name: string;
  address: string;
  phone: string;
  manager: string;
  businessHours: string;
  status: "营业中" | "暂停营业";
  members: number;
  employees: number;
  monthlyRevenue: number;
}

export interface StaffSchedule {
  id: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: "上班" | "休息" | "请假";
}
