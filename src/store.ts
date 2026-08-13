import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi, type AuthUser } from "./auth-api";
import { afterSales as seedAfterSales, appointments as seedAppointments, cardProducts as seedCardProducts, cardTransactions as seedCardTransactions, customerCards as seedCustomerCards, customerMessages as seedCustomerMessages, customers as seedCustomers, employees, marketingActivities as seedMarketingActivities, marketplaceStores, orders as seedOrders, platformAuditLogs as seedPlatformAuditLogs, promotionCoupons, saasPlans as seedSaasPlans, services as seedServices, staffMembers as seedStaffMembers, staffSchedules as seedStaffSchedules, stores as seedStores, tenants as seedTenants } from "./data";
import { canTransitionAppointment, validateAppointment, type AppointmentInput } from "./business-rules";
import { approvedStatus, canTransitionAfterSale } from "./after-sale-rules";
import { addDays, addMonths, DEMO_CONTEXT, DEMO_TODAY, demoTimestamp } from "./demo-context";
import { consumables as seedConsumables, consumableStocks as seedConsumableStocks, consumableTransactions as seedConsumableTransactions } from "./inventory-data";
import { stockEffect } from "./inventory-rules";
import type { AfterSale, AfterSaleResolution, AfterSaleType, Appointment, AppointmentStatus, CardProduct, CardTransaction, ConsumableItem, ConsumableStock, ConsumableTransaction, ConsumableTransactionType, Customer, CustomerCard, CustomerMessage, MarketingActivity, Order, PaymentMethod, PlatformAuditLog, PromotionCoupon, Role, SaaSPlan, ServiceItem, StaffMember, StaffSchedule, StoreInfo, Tenant, TenantStatus } from "./types";

interface SessionState {
  status: "idle" | "loading" | "anonymous" | "authenticated";
  role: Role | null;
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<AuthUser>;
  restore: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useSession = create<SessionState>((set, get) => ({
  status: "idle",
  role: null,
  user: null,
  login: async (username, password) => {
    try {
      const user = await authApi.login(username, password);
      set({ status: "authenticated", role: user.role, user });
      return user;
    } catch (error) {
      set({ status: "anonymous", role: null, user: null });
      throw error;
    }
  },
  restore: async () => {
    if (get().status !== "idle") return;
    set({ status: "loading" });
    try {
      const user = await authApi.refresh();
      set({ status: "authenticated", role: user.role, user });
    } catch {
      set({ status: "anonymous", role: null, user: null });
    }
  },
  logout: async () => {
    set({ status: "anonymous", role: null, user: null });
    await authApi.logout();
  },
}));

interface CustomerContextState {
  merchantId: string;
  storeId: string;
  setStoreId: (storeId: string) => void;
  resetContext: () => void;
}

interface MerchantScopeState {
  selectedStoreId: string | null;
  setSelectedStoreId: (storeId: string | null) => void;
}

export const useMerchantScope = create<MerchantScopeState>((set) => ({
  selectedStoreId: DEMO_CONTEXT.defaultStoreId,
  setSelectedStoreId: (selectedStoreId) => set({ selectedStoreId }),
}));

export const useCustomerContext = create<CustomerContextState>()(
  persist(
    (set) => ({
      merchantId: DEMO_CONTEXT.merchantId,
      storeId: DEMO_CONTEXT.defaultStoreId,
      setStoreId: (storeId) => set({ storeId }),
      resetContext: () => set({ merchantId: DEMO_CONTEXT.merchantId, storeId: DEMO_CONTEXT.defaultStoreId }),
    }),
    { name: "qiguang-customer-context-v2", version: 2 },
  ),
);

interface CustomerMarketingState {
  coupons: PromotionCoupon[];
  claimedCouponIds: string[];
  usedCouponIds: string[];
  couponLocks: Record<string, string>;
  messages: CustomerMessage[];
  addMessage: (message: Omit<CustomerMessage, "id" | "createdAt" | "read">) => void;
  claimCoupon: (couponId: string) => void;
  lockCoupon: (couponId: string, appointmentId: string) => boolean;
  releaseCoupon: (couponId: string, appointmentId: string) => void;
  redeemCoupon: (couponId: string, appointmentId?: string) => void;
  markMessageRead: (messageId: string) => void;
  markAllMessagesRead: () => void;
  resetMarketing: () => void;
}

export const useCustomerMarketing = create<CustomerMarketingState>()(
  persist(
    (set) => ({
      coupons: promotionCoupons,
      claimedCouponIds: ["QG-C001", "QG-C003"],
      usedCouponIds: [],
      couponLocks: {},
      messages: seedCustomerMessages,
      addMessage: (message) => set((state) => ({
        messages: [{ ...message, id: createId("MSG"), createdAt: demoTimestamp(), read: false }, ...state.messages],
      })),
      claimCoupon: (couponId) => set((state) => state.claimedCouponIds.includes(couponId) ? state : ({ claimedCouponIds: [...state.claimedCouponIds, couponId] })),
      lockCoupon: (couponId, appointmentId) => {
        let locked = false;
        set((state) => {
          if (!state.claimedCouponIds.includes(couponId) || state.usedCouponIds.includes(couponId) || state.couponLocks[couponId]) return state;
          locked = true;
          return { couponLocks: { ...state.couponLocks, [couponId]: appointmentId } };
        });
        return locked;
      },
      releaseCoupon: (couponId, appointmentId) => set((state) => {
        if (state.couponLocks[couponId] !== appointmentId) return state;
        const couponLocks = { ...state.couponLocks };
        delete couponLocks[couponId];
        return { couponLocks };
      }),
      redeemCoupon: (couponId, appointmentId) => set((state) => {
        if (state.usedCouponIds.includes(couponId)) return state;
        if (appointmentId && state.couponLocks[couponId] !== appointmentId) return state;
        const couponLocks = { ...state.couponLocks };
        delete couponLocks[couponId];
        return { couponLocks, usedCouponIds: [...state.usedCouponIds, couponId] };
      }),
      markMessageRead: (messageId) => set((state) => ({ messages: state.messages.map((message) => message.id === messageId ? { ...message, read: true } : message) })),
      markAllMessagesRead: () => set((state) => ({ messages: state.messages.map((message) => ({ ...message, read: true })) })),
      resetMarketing: () => set({ coupons: promotionCoupons, claimedCouponIds: ["QG-C001", "QG-C003"], usedCouponIds: [], couponLocks: {}, messages: seedCustomerMessages }),
    }),
    {
      name: "qiguang-customer-marketing-v2",
      version: 2,
      migrate: (persisted) => ({ ...(persisted as CustomerMarketingState), couponLocks: {} }),
    },
  ),
);

interface AppointmentState {
  appointments: Appointment[];
  validateBooking: (appointment: AppointmentInput) => string | null;
  addAppointment: (appointment: AppointmentInput) => Appointment | null;
  updateStatus: (id: string, status: AppointmentStatus) => Appointment | null;
  removeAppointment: (id: string) => void;
  resetAppointments: () => void;
}

export const useAppointments = create<AppointmentState>()(
  persist(
    (set, get) => ({
      appointments: seedAppointments,
      validateBooking: (input) => validateBooking(input, get().appointments),
      addAppointment: (input) => {
        let appointment: Appointment | null = null;
        set((state) => {
          if (validateBooking(input, state.appointments)) return state;
          appointment = {
            ...input,
            id: createId("A"),
            status: "待确认",
          };
          return { appointments: [...state.appointments, appointment] };
        });
        return appointment;
      },
      updateStatus: (id, status) => {
        const current = get().appointments.find((item) => item.id === id);
        if (!current || !canTransitionAppointment(current.status, status)) return null;
        const updated: Appointment = { ...current, status };
        set((state) => ({
          appointments: state.appointments.map((item) => item.id === id ? updated : item),
        }));
        if (updated.couponId && ["已取消", "未到店"].includes(status)) useCustomerMarketing.getState().releaseCoupon(updated.couponId, updated.id);
        if (status === "已完成") useInventory.getState().consumeForAppointment(updated);
        if (updated.customerId === DEMO_CONTEXT.customerId) {
          const messageByStatus: Partial<Record<AppointmentStatus, Pick<CustomerMessage, "title" | "content">>> = {
            已确认: { title: "预约已确认", content: `${updated.store}已确认你在${updated.date} ${updated.time}的${updated.service}预约。` },
            已取消: { title: "预约已取消", content: `${updated.date} ${updated.time}的${updated.service}预约已取消${updated.couponId ? "，占用的优惠券已释放" : ""}。` },
            已到店: { title: "已登记到店", content: `${updated.store}已为你登记到店，服务人员为${updated.employee}。` },
            服务中: { title: "服务已开始", content: `${updated.service}已开始，预计服务时长${updated.duration}分钟。` },
            已完成: { title: "服务已完成", content: `${updated.service}已完成，感谢本次到店，订单将在门店结算后同步到会员权益。` },
            未到店: { title: "预约已结束", content: `${updated.date} ${updated.time}的预约已标记为未到店，如有疑问请联系门店。` },
          };
          const message = messageByStatus[status];
          if (message) useCustomerMarketing.getState().addMessage({ type: "预约提醒", ...message });
        }
        return updated;
      },
      removeAppointment: (id) => set((state) => ({ appointments: state.appointments.filter((item) => item.id !== id || !["已取消", "未到店"].includes(item.status)) })),
      resetAppointments: () => set({ appointments: seedAppointments }),
    }),
    { name: "qiguang-appointments-v3", version: 3 },
  ),
);

interface InventoryState {
  consumables: ConsumableItem[];
  stocks: ConsumableStock[];
  transactions: ConsumableTransaction[];
  saveConsumable: (item: ConsumableItem) => void;
  updateStockSettings: (storeId: string, consumableId: string, safetyStock: number) => void;
  restock: (storeId: string, consumableId: string, quantity: number, operator: string) => boolean;
  submitRequest: (input: { storeId: string; consumableId: string; type: Extract<ConsumableTransactionType, "额外领用" | "退回" | "报损">; quantity: number; employeeId: string; employeeName: string; serviceId?: string; appointmentId?: string; reason: string }) => boolean;
  approveRequest: (id: string, approver: string) => boolean;
  rejectRequest: (id: string, approver: string) => boolean;
  consumeForAppointment: (appointment: Appointment) => void;
  resetInventory: () => void;
}

function updateInventoryStock(stocks: ConsumableStock[], storeId: string, consumableId: string, change: number) {
  const existing = stocks.find((item) => item.storeId === storeId && item.consumableId === consumableId);
  if (!existing) return [...stocks, { id: `ST-${consumableId}-${storeId}`, storeId, consumableId, quantity: Math.max(0, change), safetyStock: 0 }];
  return stocks.map((item) => item.id === existing.id ? { ...item, quantity: Math.max(0, item.quantity + change) } : item);
}

export const useInventory = create<InventoryState>()(
  persist(
    (set, get) => ({
      consumables: seedConsumables,
      stocks: seedConsumableStocks,
      transactions: seedConsumableTransactions,
      saveConsumable: (item) => set((state) => ({ consumables: state.consumables.some((current) => current.id === item.id) ? state.consumables.map((current) => current.id === item.id ? item : current) : [item, ...state.consumables] })),
      updateStockSettings: (storeId, consumableId, safetyStock) => set((state) => {
        const existing = state.stocks.find((item) => item.storeId === storeId && item.consumableId === consumableId);
        if (existing) return { stocks: state.stocks.map((item) => item.id === existing.id ? { ...item, safetyStock: Math.max(0, safetyStock) } : item) };
        return { stocks: [...state.stocks, { id: `ST-${consumableId}-${storeId}`, storeId, consumableId, quantity: 0, safetyStock: Math.max(0, safetyStock) }] };
      }),
      restock: (storeId, consumableId, quantity, operator) => {
        if (quantity <= 0 || !get().consumables.some((item) => item.id === consumableId)) return false;
        const transaction: ConsumableTransaction = { id: createId("MT"), merchantId: DEMO_CONTEXT.merchantId, storeId, consumableId, type: "入库", quantity, change: quantity, status: "已通过", operator, approver: operator, createdAt: demoTimestamp(), approvedAt: demoTimestamp() };
        set((state) => ({ stocks: updateInventoryStock(state.stocks, storeId, consumableId, quantity), transactions: [transaction, ...state.transactions] }));
        return true;
      },
      submitRequest: (input) => {
        if (input.quantity <= 0 || !input.reason.trim()) return false;
        const transaction: ConsumableTransaction = { ...input, id: createId("MT"), merchantId: DEMO_CONTEXT.merchantId, quantity: input.quantity, change: stockEffect(input.type, input.quantity), status: "待审批", reason: input.reason.trim(), operator: input.employeeName, createdAt: demoTimestamp() };
        set((state) => ({ transactions: [transaction, ...state.transactions] }));
        return true;
      },
      approveRequest: (id, approver) => {
        const current = get().transactions.find((item) => item.id === id && item.status === "待审批");
        if (!current) return false;
        set((state) => ({
          stocks: updateInventoryStock(state.stocks, current.storeId, current.consumableId, current.change),
          transactions: state.transactions.map((item) => item.id === id ? { ...item, status: "已通过", approver, approvedAt: demoTimestamp() } : item),
        }));
        return true;
      },
      rejectRequest: (id, approver) => {
        if (!get().transactions.some((item) => item.id === id && item.status === "待审批")) return false;
        set((state) => ({ transactions: state.transactions.map((item) => item.id === id ? { ...item, status: "已驳回", approver, approvedAt: demoTimestamp() } : item) }));
        return true;
      },
      consumeForAppointment: (appointment) => {
        if (!appointment.storeId || !appointment.serviceId) return;
        const service = useOperations.getState().services.find((item) => item.id === appointment.serviceId);
        const usages = service?.consumables ?? [];
        const existing = new Set(get().transactions.filter((item) => item.appointmentId === appointment.id && item.type === "标准消耗").map((item) => item.consumableId));
        const pendingUsages = usages.filter((usage) => !existing.has(usage.consumableId));
        if (!pendingUsages.length) return;
        const createdAt = demoTimestamp();
        set((state) => ({
          stocks: pendingUsages.reduce((stocks, usage) => updateInventoryStock(stocks, appointment.storeId!, usage.consumableId, -usage.quantity), state.stocks),
          transactions: [
            ...pendingUsages.map((usage): ConsumableTransaction => ({ id: createId("MT"), merchantId: appointment.merchantId ?? DEMO_CONTEXT.merchantId, storeId: appointment.storeId!, consumableId: usage.consumableId, type: "标准消耗", quantity: usage.quantity, change: -usage.quantity, status: "已通过", employeeId: appointment.employeeId, employeeName: appointment.employee, serviceId: appointment.serviceId, appointmentId: appointment.id, operator: "系统", createdAt, approvedAt: createdAt })),
            ...state.transactions,
          ],
        }));
      },
      resetInventory: () => set({ consumables: seedConsumables, stocks: seedConsumableStocks, transactions: seedConsumableTransactions }),
    }),
    { name: "qiguang-inventory-v1", version: 1 },
  ),
);

function validateBooking(input: AppointmentInput, appointments: Appointment[]) {
  const operation = useOperations.getState();
  const staff = operation.staff.find((item) => item.id === input.employeeId);
  const employee = staff ? { id: staff.id, name: staff.name, title: staff.title, rating: "4.9", serviceIds: staff.serviceIds } : employees.find((item) => item.id === input.employeeId);
  const operationStore = operation.stores.find((item) => item.id === input.storeId);
  const storedMarketplaceStore = marketplaceStores.find((item) => item.id === input.storeId);
  const marketplaceStore = storedMarketplaceStore ?? (operationStore ? {
    id: operationStore.id,
    merchantId: operationStore.merchantId,
    merchantName: "栖光美学",
    name: operationStore.name,
    category: "综合护理",
    coverImage: marketplaceStores[0].coverImage,
    rating: 5,
    reviewCount: 0,
    distance: 0,
    address: operationStore.address,
    businessHours: operationStore.businessHours,
    tags: ["品牌门店"],
    serviceIds: operation.services.filter((item) => item.storeIds?.includes(operationStore.id)).map((item) => item.id),
    employeeIds: operation.staff.filter((item) => item.storeId === operationStore.id && item.status === "在职").map((item) => item.id),
  } : undefined);
  return validateAppointment(input, appointments, {
    marketplaceStore,
    operationStore,
    service: operation.services.find((item) => item.id === input.serviceId),
    employee,
    staff,
    schedule: operation.schedules.find((item) => item.employeeId === input.employeeId && item.date === input.date),
  });
}

interface CommerceState {
  customers: Customer[];
  orders: Order[];
  cardProducts: CardProduct[];
  customerCards: CustomerCard[];
  cardTransactions: CardTransaction[];
  saveCustomer: (customer: Customer) => void;
  createOrderFromAppointment: (appointment: Appointment) => Order;
  createWalkInOrder: (input: Pick<Order, "customerId" | "customer" | "service" | "employee" | "employeeId" | "store" | "storeId" | "serviceId" | "amount">) => Order;
  settleOrder: (orderId: string, method: PaymentMethod, discount?: number, customerCardId?: string, context?: { source: "收银台" | "员工核销"; employeeId?: string }) => boolean;
  redeemCardByEmployee: (orderId: string, employeeId: string, customerCardId: string) => boolean;
  sellCard: (customerId: string, productId: string) => CustomerCard | null;
  resetCommerce: () => void;
}

export const useCommerce = create<CommerceState>()(
  persist(
    (set, get) => ({
      customers: seedCustomers,
      orders: seedOrders,
      cardProducts: seedCardProducts,
      customerCards: seedCustomerCards,
      cardTransactions: seedCardTransactions,
      saveCustomer: (customer) => set((state) => ({ customers: state.customers.some((item) => item.id === customer.id) ? state.customers.map((item) => item.id === customer.id ? customer : item) : [customer, ...state.customers] })),
      createOrderFromAppointment: (appointment) => {
        const existing = get().orders.find((order) => order.appointmentId === appointment.id);
        if (existing) return existing;
          const customer = get().customers.find((item) => item.id === appointment.customerId);
          const amount = appointment.originalPrice ?? appointment.price;
          const order: Order = {
          id: createId("O"),
          appointmentId: appointment.id,
          customerId: customer?.id ?? "C-GUEST",
          merchantId: appointment.merchantId,
          storeId: appointment.storeId,
          serviceId: appointment.serviceId,
          employeeId: appointment.employeeId,
          activityId: appointment.activityId,
          couponId: appointment.couponId,
          originalPrice: appointment.originalPrice,
          customer: appointment.customer,
          service: appointment.service,
          employee: appointment.employee,
          store: appointment.store,
            amount,
            discount: Math.max(0, amount - appointment.price),
          payable: appointment.price,
          status: "待结算",
          createdAt: `${appointment.date} ${appointment.time}`,
        };
        set((state) => ({ orders: [order, ...state.orders] }));
        return order;
      },
      createWalkInOrder: (input) => {
        const order: Order = { ...input, id: createId("O"), discount: 0, payable: input.amount, status: "待结算", createdAt: demoTimestamp() };
        set((state) => ({ orders: [order, ...state.orders] }));
        return order;
      },
      settleOrder: (orderId, method, discount = 0, customerCardId, context = { source: "收银台" }) => {
        let settled = false;
        set((state) => {
          const order = state.orders.find((item) => item.id === orderId);
          if (!order || order.status !== "待结算") return state;
          let customerCards = state.customerCards;
          let cardTransactions = state.cardTransactions;
          if (method === "次卡") {
            const card = customerCards.find((item) => item.id === customerCardId && item.customerId === order.customerId && item.service === order.service && item.remainingTimes > 0 && item.status === "使用中" && item.expiresAt >= DEMO_TODAY);
            if (!card) return state;
            const balance = card.remainingTimes - 1;
            customerCards = customerCards.map((item) => item.id === card.id ? { ...item, remainingTimes: balance, status: balance === 0 ? "已用完" : "使用中" } : item);
            cardTransactions = [{
              id: createId("CT"),
              cardId: card.id,
              customerId: order.customerId,
              type: "核销",
              change: -1,
              balance,
              orderId,
              appointmentId: order.appointmentId,
              employeeId: context.employeeId ?? order.employeeId,
              employeeName: order.employee,
              source: context.source,
              note: order.service,
              createdAt: demoTimestamp(),
            }, ...cardTransactions];
          }
          const payable = method === "次卡" ? 0 : Math.max(0, order.amount - discount);
          const orders = state.orders.map((item) => item.id === orderId ? { ...item, discount, payable, paymentMethod: method, customerCardId, status: "已完成" as const, completedAt: demoTimestamp() } : item);
          const customers = state.customers.map((item) => item.id === order.customerId ? { ...item, totalSpend: item.totalSpend + payable, visits: item.visits + 1, lastVisit: DEMO_TODAY } : item);
          settled = true;
          return { ...state, orders, customers, customerCards, cardTransactions };
        });
        const order = get().orders.find((item) => item.id === orderId);
        if (settled && order?.couponId) useCustomerMarketing.getState().redeemCoupon(order.couponId, order.appointmentId);
        return settled;
      },
      redeemCardByEmployee: (orderId, employeeId, customerCardId) => {
        const order = get().orders.find((item) => item.id === orderId);
        if (!order || order.status !== "待结算" || order.employeeId !== employeeId) return false;
        return get().settleOrder(orderId, "次卡", 0, customerCardId, { source: "员工核销", employeeId });
      },
      sellCard: (customerId, productId) => {
        const product = get().cardProducts.find((item) => item.id === productId && item.active);
        if (!product || !get().customers.some((item) => item.id === customerId)) return null;
        const purchasedAt = DEMO_TODAY;
        const card: CustomerCard = { id: createId("CC"), customerId, productId, name: product.name, service: product.service, totalTimes: product.totalTimes, remainingTimes: product.totalTimes, purchasedAt, expiresAt: addDays(purchasedAt, product.validDays), status: "使用中" };
        const transaction: CardTransaction = { id: createId("CT"), cardId: card.id, customerId, type: "购卡", change: product.totalTimes, balance: product.totalTimes, note: `购买${product.name}`, createdAt: demoTimestamp() };
        set((state) => ({
          customerCards: [card, ...state.customerCards],
          cardTransactions: [transaction, ...state.cardTransactions],
          customers: state.customers.map((item) => item.id === customerId ? { ...item, totalSpend: item.totalSpend + product.price } : item),
        }));
        return card;
      },
      resetCommerce: () => set({ customers: seedCustomers, orders: seedOrders, cardProducts: seedCardProducts, customerCards: seedCustomerCards, cardTransactions: seedCardTransactions }),
    }),
    {
      name: "qiguang-commerce-v2",
      version: 3,
      migrate: (persisted) => {
        const state = persisted as Partial<CommerceState>;
        const demoPendingOrder = seedOrders.find((order) => order.id === "O26081304");
        if (!demoPendingOrder || state.orders?.some((order) => order.id === demoPendingOrder.id)) return state;
        return { ...state, orders: [demoPendingOrder, ...(state.orders ?? [])] };
      },
    },
  ),
);

interface AfterSaleState {
  afterSales: AfterSale[];
  createAfterSale: (input: { orderId: string; type: AfterSaleType; reason: string; contact: string }) => AfterSale | null;
  receiveAfterSale: (id: string, operator: string) => boolean;
  submitAfterSaleProposal: (id: string, operator: string, resolution: AfterSaleResolution, amount: number, note: string) => boolean;
  approveAfterSale: (id: string, operator: string, approved: boolean, note: string) => boolean;
  completeAfterSale: (id: string, operator: string, note: string) => boolean;
  resetAfterSales: () => void;
}

function afterSaleLog(actor: string, action: string, note?: string) {
  return { id: createId("ASL"), actor, action, note: note?.trim() || undefined, createdAt: demoTimestamp() };
}

export const useAfterSales = create<AfterSaleState>()(
  persist(
    (set, get) => ({
      afterSales: seedAfterSales,
      createAfterSale: ({ orderId, type, reason, contact }) => {
        const order = useCommerce.getState().orders.find((item) => item.id === orderId && item.status === "已完成");
        if (!order || !reason.trim() || get().afterSales.some((item) => item.orderId === orderId && !["已完成", "已驳回"].includes(item.status))) return null;
        const customer = useCommerce.getState().customers.find((item) => item.id === order.customerId);
        const createdAt = demoTimestamp();
        const afterSale: AfterSale = {
          id: createId("AS"),
          orderId: order.id,
          merchantId: order.merchantId ?? DEMO_CONTEXT.merchantId,
          storeId: order.storeId ?? DEMO_CONTEXT.defaultStoreId,
          customerId: order.customerId,
          customer: order.customer,
          service: order.service,
          type,
          reason: reason.trim(),
          contact: contact.trim() || customer?.phone || "",
          requestedAmount: order.payable,
          status: "待受理",
          createdAt,
          updatedAt: createdAt,
          logs: [{ id: createId("ASL"), actor: order.customer, action: "提交售后申请", note: type, createdAt }],
        };
        set((state) => ({ afterSales: [afterSale, ...state.afterSales] }));
        return afterSale;
      },
      receiveAfterSale: (id, operator) => {
        const current = get().afterSales.find((item) => item.id === id);
        if (!current || !canTransitionAfterSale(current.status, "处理中")) return false;
        set((state) => ({ afterSales: state.afterSales.map((item) => item.id === id ? { ...item, status: "处理中", handler: operator, updatedAt: demoTimestamp(), logs: [...item.logs, afterSaleLog(operator, "受理售后")] } : item) }));
        return true;
      },
      submitAfterSaleProposal: (id, operator, resolution, amount, note) => {
        const current = get().afterSales.find((item) => item.id === id);
        if (!current || !canTransitionAfterSale(current.status, "待审批") || !note.trim()) return false;
        const approvedAmount = resolution === "退款" ? Math.min(current.requestedAmount, Math.max(0, amount)) : 0;
        set((state) => ({ afterSales: state.afterSales.map((item) => item.id === id ? { ...item, status: "待审批", resolution, approvedAmount, handler: operator, updatedAt: demoTimestamp(), logs: [...item.logs, afterSaleLog(operator, `提交${resolution}方案`, note)] } : item) }));
        return true;
      },
      approveAfterSale: (id, operator, approved, note) => {
        const current = get().afterSales.find((item) => item.id === id);
        if (!current || current.status !== "待审批" || !current.resolution) return false;
        const nextStatus = approved ? approvedStatus(current.resolution) : "已驳回";
        if (!canTransitionAfterSale(current.status, nextStatus)) return false;
        set((state) => ({ afterSales: state.afterSales.map((item) => item.id === id ? { ...item, status: nextStatus, updatedAt: demoTimestamp(), logs: [...item.logs, afterSaleLog(operator, approved ? "审批通过" : "驳回售后", note)] } : item) }));
        return true;
      },
      completeAfterSale: (id, operator, note) => {
        const current = get().afterSales.find((item) => item.id === id);
        if (!current || !current.resolution || !canTransitionAfterSale(current.status, "已完成")) return false;
        if (current.resolution === "退款") {
          useCommerce.setState((state) => ({
            orders: state.orders.map((order) => order.id === current.orderId ? { ...order, status: "已退款" as const } : order),
            customers: state.customers.map((customer) => customer.id === current.customerId ? { ...customer, totalSpend: Math.max(0, customer.totalSpend - (current.approvedAmount ?? 0)) } : customer),
          }));
        }
        if (current.resolution === "恢复卡次") {
          const order = useCommerce.getState().orders.find((item) => item.id === current.orderId);
          const card = useCommerce.getState().customerCards.find((item) => item.id === order?.customerCardId);
          if (card) {
            const balance = card.remainingTimes + 1;
            useCommerce.setState((state) => ({
              customerCards: state.customerCards.map((item) => item.id === card.id ? { ...item, remainingTimes: balance, status: "使用中" as const } : item),
              cardTransactions: [{ id: createId("CT"), cardId: card.id, customerId: current.customerId, type: "调整", change: 1, balance, orderId: current.orderId, note: "售后恢复卡次", createdAt: demoTimestamp() }, ...state.cardTransactions],
            }));
          }
        }
        set((state) => ({ afterSales: state.afterSales.map((item) => item.id === id ? { ...item, status: "已完成", updatedAt: demoTimestamp(), logs: [...item.logs, afterSaleLog(operator, "完成售后", note)] } : item) }));
        return true;
      },
      resetAfterSales: () => set({ afterSales: seedAfterSales }),
    }),
    { name: "qiguang-after-sales-v1", version: 1 },
  ),
);

function createId(prefix: string) {
  const suffix = globalThis.crypto?.randomUUID?.().replaceAll("-", "").slice(0, 10) ?? `${Date.now()}${Math.random()}`.replace(".", "").slice(-10);
  return `${prefix}${suffix.toUpperCase()}`;
}


interface PlatformState {
  tenants: Tenant[];
  plans: SaaSPlan[];
  logs: PlatformAuditLog[];
  addTenant: (tenant: Tenant) => void;
  removeTenant: (tenantId: string) => void;
  savePlan: (plan: SaaSPlan) => void;
  removePlan: (planId: string) => void;
  updateTenantStatus: (tenantId: string, status: TenantStatus) => void;
  renewTenant: (tenantId: string, months: number) => void;
  changeTenantPlan: (tenantId: string, planId: string) => void;
  resetPlatform: () => void;
}

export const usePlatform = create<PlatformState>()(
  persist(
    (set) => ({
      tenants: seedTenants,
      plans: seedSaasPlans,
      logs: seedPlatformAuditLogs,
      addTenant: (tenant) => set((state) => ({
        tenants: [tenant, ...state.tenants],
        logs: [createPlatformLog("开通商家", tenant.name, `${state.plans.find((plan) => plan.id === tenant.planId)?.name ?? "套餐"}试用 14 天`, "普通"), ...state.logs],
      })),
      removeTenant: (tenantId) => set((state) => {
        const tenant = state.tenants.find((item) => item.id === tenantId);
        if (!tenant) return state;
        return {
          tenants: state.tenants.filter((item) => item.id !== tenantId),
          logs: [createPlatformLog("删除商家", tenant.name, "商家及其试用账号已删除", "重要"), ...state.logs],
        };
      }),
      savePlan: (plan) => set((state) => {
        const existing = state.plans.find((item) => item.id === plan.id);
        return {
          plans: existing ? state.plans.map((item) => item.id === plan.id ? plan : item) : [...state.plans, plan],
          logs: [createPlatformLog(existing ? "编辑套餐" : "新建套餐", plan.name, `${plan.active ? "启用" : "停用"} · ¥${plan.price}/年`, "重要"), ...state.logs],
        };
      }),
      removePlan: (planId) => set((state) => {
        const plan = state.plans.find((item) => item.id === planId);
        if (!plan || state.tenants.some((tenant) => tenant.planId === planId)) return state;
        return {
          plans: state.plans.filter((item) => item.id !== planId),
          logs: [createPlatformLog("删除套餐", plan.name, "未使用套餐已删除", "重要"), ...state.logs],
        };
      }),
      updateTenantStatus: (tenantId, status) => set((state) => {
        const tenant = state.tenants.find((item) => item.id === tenantId);
        if (!tenant || tenant.status === status) return state;
        return {
          tenants: state.tenants.map((item) => item.id === tenantId ? { ...item, status } : item),
          logs: [createPlatformLog(status === "已冻结" ? "冻结商家" : "启用商家", tenant.name, `商家状态调整为${status}`, "重要"), ...state.logs],
        };
      }),
      renewTenant: (tenantId, months) => set((state) => {
        const tenant = state.tenants.find((item) => item.id === tenantId);
        if (!tenant) return state;
        const base = new Date(`${tenant.expiresAt}T00:00:00`) > new Date(`${DEMO_TODAY}T00:00:00`) ? tenant.expiresAt : DEMO_TODAY;
        const expiresAt = addMonths(base, months);
        return {
          tenants: state.tenants.map((item) => item.id === tenantId ? { ...item, expiresAt, status: "正常" } : item),
          logs: [createPlatformLog("商家续期", tenant.name, `套餐续期 ${months} 个月，至 ${expiresAt}`, "重要"), ...state.logs],
        };
      }),
      changeTenantPlan: (tenantId, planId) => set((state) => {
        const tenant = state.tenants.find((item) => item.id === tenantId);
        const plan = state.plans.find((item) => item.id === planId);
        if (!tenant || !plan || tenant.planId === planId) return state;
        return {
          tenants: state.tenants.map((item) => item.id === tenantId ? { ...item, planId } : item),
          logs: [createPlatformLog("变更套餐", tenant.name, `套餐调整为${plan.name}`, "重要"), ...state.logs],
        };
      }),
      resetPlatform: () => set({ tenants: seedTenants, plans: seedSaasPlans, logs: seedPlatformAuditLogs }),
    }),
    { name: "qiguang-platform-v2" },
  ),
);

function createPlatformLog(action: string, target: string, detail: string, risk: PlatformAuditLog["risk"]): PlatformAuditLog {
  return { id: createId("L"), operator: "平台运营", action, target, detail, createdAt: demoTimestamp(), risk };
}

interface OperationsState {
  staff: StaffMember[];
  stores: StoreInfo[];
  schedules: StaffSchedule[];
  services: ServiceItem[];
  activities: MarketingActivity[];
  saveStaff: (staff: StaffMember) => void;
  saveStore: (store: StoreInfo) => void;
  saveService: (service: ServiceItem) => void;
  saveActivity: (activity: MarketingActivity) => void;
  toggleStaffStatus: (staffId: string) => void;
  toggleStoreStatus: (storeId: string) => void;
  toggleServiceStatus: (serviceId: string) => void;
  toggleActivityStatus: (activityId: string) => void;
  setScheduleType: (employeeId: string, date: string, type: StaffSchedule["type"] | null) => void;
  saveSchedules: (schedules: StaffSchedule[]) => void;
  resetOperations: () => void;
}

export const useOperations = create<OperationsState>()(
  persist(
    (set) => ({
      staff: seedStaffMembers,
      stores: seedStores,
      schedules: seedStaffSchedules,
      services: seedServices,
      activities: seedMarketingActivities,
      saveStaff: (staff) => set((state) => ({ staff: state.staff.some((item) => item.id === staff.id) ? state.staff.map((item) => item.id === staff.id ? staff : item) : [staff, ...state.staff] })),
      saveStore: (store) => set((state) => ({ stores: state.stores.some((item) => item.id === store.id) ? state.stores.map((item) => item.id === store.id ? store : item) : [store, ...state.stores] })),
      saveService: (service) => set((state) => ({ services: state.services.some((item) => item.id === service.id) ? state.services.map((item) => item.id === service.id ? service : item) : [service, ...state.services] })),
      saveActivity: (activity) => set((state) => ({ activities: state.activities.some((item) => item.id === activity.id) ? state.activities.map((item) => item.id === activity.id ? activity : item) : [activity, ...state.activities] })),
      toggleStaffStatus: (staffId) => set((state) => ({ staff: state.staff.map((item) => item.id === staffId ? { ...item, status: item.status === "在职" ? "停用" : "在职" } : item) })),
      toggleStoreStatus: (storeId) => set((state) => ({ stores: state.stores.map((item) => item.id === storeId ? { ...item, status: item.status === "营业中" ? "暂停营业" : "营业中" } : item) })),
      toggleServiceStatus: (serviceId) => set((state) => ({ services: state.services.map((item) => item.id === serviceId ? { ...item, isOnline: !item.isOnline } : item) })),
      toggleActivityStatus: (activityId) => set((state) => ({ activities: state.activities.map((item) => item.id === activityId ? { ...item, status: item.status === "已停用" ? "进行中" : "已停用" } : item) })),
      setScheduleType: (employeeId, date, type) => set((state) => {
        const existing = state.schedules.find((item) => item.employeeId === employeeId && item.date === date);
        if (!type) return { schedules: state.schedules.filter((item) => item.employeeId !== employeeId || item.date !== date) };
        if (existing) return { schedules: state.schedules.map((item) => item.id === existing.id ? { ...item, type } : item) };
        return { schedules: [...state.schedules, { id: createId("SH"), employeeId, date, startTime: "09:30", endTime: "18:30", type }] };
      }),
      saveSchedules: (entries) => set((state) => {
        const keys = new Set(entries.map((item) => `${item.employeeId}:${item.date}`));
        return { schedules: [...state.schedules.filter((item) => !keys.has(`${item.employeeId}:${item.date}`)), ...entries] };
      }),
      resetOperations: () => set({ staff: seedStaffMembers, stores: seedStores, schedules: seedStaffSchedules, services: seedServices, activities: seedMarketingActivities }),
    }),
    {
      name: "qiguang-operations-v3",
      version: 3,
      migrate: () => ({ staff: seedStaffMembers, stores: seedStores, schedules: seedStaffSchedules, services: seedServices, activities: seedMarketingActivities }),
    },
  ),
);
