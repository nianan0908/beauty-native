import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  Phone,
  Sparkles,
  TicketPercent,
  Timer,
  PackageOpen,
  UserRound,
  X,
} from "lucide-react";
import { bookingDates, bookingTimes, marketplaceStores } from "./data";
import { DEMO_CONTEXT, DEMO_TODAY } from "./demo-context";
import { useAppointments, useCommerce, useCustomerMarketing, useInventory, useMerchantScope, useOperations } from "./store";
import { bestCoupon, couponDiscount, isCouponApplicable } from "./marketing-utils";
import type { Appointment, AppointmentStatus, BookingOffer, MarketplaceStore, Role } from "./types";

const customerBrandStores = marketplaceStores.filter((store) => store.merchantId === DEMO_CONTEXT.merchantId);

const transitions: Partial<Record<AppointmentStatus, AppointmentStatus[]>> = {
  待确认: ["已确认", "已取消"],
  已确认: ["已到店", "未到店", "已取消"],
  已到店: ["服务中"],
  服务中: ["已完成"],
};

const actionLabels: Partial<Record<AppointmentStatus, string>> = {
  已确认: "确认预约",
  已到店: "登记到店",
  未到店: "标记未到店",
  服务中: "开始服务",
  已完成: "完成服务",
  已取消: "取消预约",
};

function AppointmentStatusBadge({ value }: { value: AppointmentStatus }) {
  return <span className={`status status-${value}`}>{value}</span>;
}

function formatDate(value: string) {
  const [, month, day] = value.split("-");
  return `${Number(month)}月${Number(day)}日`;
}

export function AppointmentCenter({ role }: { role: Role }) {
  const appointments = useAppointments((state) => state.appointments);
  const addAppointment = useAppointments((state) => state.addAppointment);
  const validateBooking = useAppointments((state) => state.validateBooking);
  const updateStatus = useAppointments((state) => state.updateStatus);
  const removeAppointment = useAppointments((state) => state.removeAppointment);
  const customers = useCommerce((state) => state.customers);
  const createOrderFromAppointment = useCommerce((state) => state.createOrderFromAppointment);
  const stores = useOperations((state) => state.stores);
  const services = useOperations((state) => state.services);
  const staff = useOperations((state) => state.staff);
  const consumables = useInventory((state) => state.consumables);
  const submitInventoryRequest = useInventory((state) => state.submitRequest);
  const [selectedDate, setSelectedDate] = useState(DEMO_TODAY);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "全部">("全部");
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestType, setRequestType] = useState<"额外领用" | "退回" | "报损">("额外领用");
  const [requestConsumableId, setRequestConsumableId] = useState("");
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [requestReason, setRequestReason] = useState("");
  const selectedStoreId = useMerchantScope((state) => state.selectedStoreId);
  const [composer, setComposer] = useState(false);
  const [formStoreId, setFormStoreId] = useState(selectedStoreId ?? stores[0]?.id ?? "");
  const [formCustomerId, setFormCustomerId] = useState(customers[0]?.id ?? "");
  const [formServiceId, setFormServiceId] = useState("");
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formDate, setFormDate] = useState(bookingDates[0].value);
  const [formTime, setFormTime] = useState(bookingTimes[0]);
  const [formNote, setFormNote] = useState("");
  const [formError, setFormError] = useState("");
  const selected = appointments.find((item) => item.id === selectedId && (!selectedStoreId || item.storeId === selectedStoreId)) ?? null;
  const isEmployee = role === "employee";
  const isReceptionist = role === "receptionist";
  const availableTransitions = selected
    ? (transitions[selected.status] ?? []).filter((status) => !isReceptionist || ["已确认", "已到店", "未到店", "已取消"].includes(status))
    : [];
  const availableDates = [
    { value: DEMO_TODAY, week: "今天", day: DEMO_TODAY.slice(-2) },
    ...bookingDates.slice(0, 4),
  ];
  const visibleAppointments = useMemo(() => appointments
    .filter((item) => item.date === selectedDate)
    .filter((item) => !selectedStoreId || item.storeId === selectedStoreId)
    .filter((item) => !isEmployee || item.employeeId === DEMO_CONTEXT.employeeId)
    .filter((item) => statusFilter === "全部" || item.status === statusFilter)
    .sort((a, b) => a.time.localeCompare(b.time)), [appointments, isEmployee, selectedDate, selectedStoreId, statusFilter]);
  const formStore = stores.find((store) => store.id === formStoreId);
  const formCustomer = customers.find((customer) => customer.id === formCustomerId);
  const formServices = services.filter((service) => service.merchantId === DEMO_CONTEXT.merchantId && service.isOnline && service.bookingEnabled && service.storeIds?.includes(formStoreId));
  const formService = formServices.find((service) => service.id === formServiceId) ?? formServices[0];
  const formEmployees = staff.filter((member) => member.storeId === formStoreId && member.status === "在职" && formService?.id && member.serviceIds.includes(formService.id));
  const formEmployee = formEmployees.find((member) => member.id === formEmployeeId) ?? formEmployees[0];
  const createFormInput = (time: string) => formStore && formCustomer && formService && formEmployee ? {
    merchantId: DEMO_CONTEXT.merchantId,
    storeId: formStore.id,
    customerId: formCustomer.id,
    serviceId: formService.id,
    employeeId: formEmployee.id,
    date: formDate,
    time,
    customer: formCustomer.name,
    phone: formCustomer.phone,
    service: formService.name,
    employee: formEmployee.name,
    store: formStore.name,
    duration: formService.duration,
    price: formService.price,
    note: formNote.trim(),
  } : null;
  const unavailableFormTimes = bookingTimes.filter((time) => {
    const input = createFormInput(time);
    return !input || Boolean(validateBooking(input));
  });

  const openComposer = () => {
    const storeId = selectedStoreId ?? stores[0]?.id ?? "";
    const service = services.find((item) => item.merchantId === DEMO_CONTEXT.merchantId && item.isOnline && item.bookingEnabled && item.storeIds?.includes(storeId));
    const employee = staff.find((member) => member.storeId === storeId && member.status === "在职" && service && member.serviceIds.includes(service.id));
    setFormStoreId(storeId);
    setFormCustomerId(customers[0]?.id ?? "");
    setFormServiceId(service?.id ?? "");
    setFormEmployeeId(employee?.id ?? "");
    setFormDate(bookingDates[0].value);
    setFormTime(bookingTimes[0]);
    setFormNote("");
    setFormError("");
    setComposer(true);
  };

  const submitAppointment = () => {
    const input = createFormInput(formTime);
    if (!input) {
      setFormError("请先选择可服务的门店、项目和员工。");
      return;
    }
    const validationError = validateBooking(input);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    const result = addAppointment(input);
    if (!result) {
      setFormError("该时段刚刚被占用，请重新选择。");
      return;
    }
    updateStatus(result.id, "已确认");
    setSelectedDate(result.date);
    setStatusFilter("全部");
    setSelectedId(result.id);
    setComposer(false);
  };

  const advance = (status: AppointmentStatus) => {
    if (!selected) return;
    const updated = updateStatus(selected.id, status);
    if (updated && status === "已完成") createOrderFromAppointment(updated);
    if (["已完成", "已取消", "未到店"].includes(status)) setSelectedId(null);
  };
  const openConsumableRequest = () => {
    if (!selected) return;
    const standardItems = services.find((item) => item.id === selected.serviceId)?.consumables ?? [];
    setRequestConsumableId(standardItems[0]?.consumableId ?? consumables[0]?.id ?? "");
    setRequestQuantity(1);
    setRequestReason("");
    setRequestOpen(true);
  };
  const submitConsumableRequest = () => {
    if (!selected?.storeId || !requestConsumableId) return;
    const submitted = submitInventoryRequest({ storeId: selected.storeId, consumableId: requestConsumableId, type: requestType, quantity: requestQuantity, employeeId: selected.employeeId ?? DEMO_CONTEXT.employeeId, employeeName: selected.employee, serviceId: selected.serviceId, appointmentId: selected.id, reason: requestReason });
    if (submitted) setRequestOpen(false);
  };

  return (
    <>
      <div className="page-heading appointment-title">
        <div><span className="date-line">APPOINTMENT CENTER</span><h1>{isEmployee ? "我的日程" : isReceptionist ? "预约接待" : "预约中心"}</h1><p>{isEmployee ? "查看个人服务安排并更新服务进度。" : isReceptionist ? "处理代客预约、预约确认和顾客到店登记。" : "按日期管理预约、到店和服务状态。"}</p></div>
        {!isEmployee && <button className="primary-action" onClick={openComposer}><CalendarDays size={17} /> 代客预约</button>}
      </div>

      <section className="calendar-toolbar panel">
        <div className="date-strip">
          {availableDates.map((date) => (
            <button key={date.value} className={selectedDate === date.value ? "active" : ""} onClick={() => setSelectedDate(date.value)}>
              <span>{date.week}</span><strong>{date.day}</strong>
            </button>
          ))}
        </div>
        <div className="status-filter">
          {(["全部", "待确认", "已确认", "服务中", "已完成"] as const).map((status) => (
            <button className={statusFilter === status ? "active" : ""} key={status} onClick={() => setStatusFilter(status)}>{status}</button>
          ))}
        </div>
      </section>

      <section className="appointment-board">
        <article className="panel day-schedule">
          <div className="panel-head"><div><h2>{formatDate(selectedDate)}安排</h2><p>{visibleAppointments.length} 项预约</p></div><span className="capacity">可预约 6 个时段</span></div>
          {visibleAppointments.length ? (
            <div className="schedule-lines">
              {visibleAppointments.map((item) => (
                <button className={`schedule-item ${selectedId === item.id ? "selected" : ""}`} key={item.id} onClick={() => setSelectedId(item.id)}>
                  <time>{item.time}<small>{item.duration} min</small></time>
                  <span className="schedule-line" />
                  <span className="schedule-service"><strong>{item.service}</strong><small>{item.customer} · {item.employee}</small></span>
                  <AppointmentStatusBadge value={item.status} />
                  <ChevronRight size={17} />
                </button>
              ))}
            </div>
          ) : <div className="empty-schedule"><CalendarCheck size={28} /><strong>当前日期暂无安排</strong><span>可以切换日期或新建预约</span></div>}
        </article>

        <aside className={`panel appointment-detail ${selected ? "has-selection" : ""}`}>
          {selected ? <>
            <div className="detail-head"><div><span>预约编号 {selected.id}</span><h2>{selected.service}</h2></div><button onClick={() => setSelectedId(null)}><X size={18} /></button></div>
            <AppointmentStatusBadge value={selected.status} />
            <div className="detail-time"><CalendarDays size={20} /><div><strong>{formatDate(selected.date)} · {selected.time}</strong><span>{selected.duration} 分钟 · {selected.store}</span></div></div>
            <div className="detail-section"><span>顾客信息</span><div className="customer-line"><i>{selected.customer.slice(0, 1)}</i><div><strong>{selected.customer}</strong><small>{selected.phone}</small></div><button title="联系顾客"><Phone size={17} /></button></div></div>
            <div className="detail-section"><span>服务信息</span><dl><div><dt>服务员工</dt><dd>{selected.employee}</dd></div><div><dt>项目金额</dt><dd>¥{selected.price}</dd></div><div><dt>顾客备注</dt><dd>{selected.note || "无"}</dd></div></dl></div>
            {isEmployee && <div className="appointment-consumables"><div><span>本次标准耗材</span><button onClick={openConsumableRequest}><PackageOpen size={14} />耗材申请</button></div>{(services.find((item) => item.id === selected.serviceId)?.consumables ?? []).map((usage) => { const item = consumables.find((current) => current.id === usage.consumableId); return <p key={usage.consumableId}><span>{item?.name}</span><strong>{usage.quantity} {item?.unit}</strong></p>; })}</div>}
            {availableTransitions.length ? <div className="detail-actions">
              {availableTransitions.map((status, index) => (
                <button className={index === 0 ? "main" : "secondary"} key={status} onClick={() => advance(status)}>{actionLabels[status]}</button>
              ))}
            </div> : <div className="final-state"><CheckCircle2 size={20} /><span>{isReceptionist && ["已到店", "服务中"].includes(selected.status) ? "接待已完成，等待服务员工更新进度" : "该预约流程已结束"}</span>{["已取消", "未到店"].includes(selected.status) && <button onClick={() => { removeAppointment(selected.id); setSelectedId(null); }}>删除记录</button>}</div>}
          </> : <div className="detail-empty"><CalendarCheck size={32} /><strong>选择一条预约</strong><span>查看顾客、服务和状态操作</span></div>}
        </aside>
      </section>
      {requestOpen && selected && <><button className="commerce-scrim" onClick={() => setRequestOpen(false)} aria-label="关闭耗材申请" /><aside className="commerce-drawer"><div className="drawer-head"><div><span>CONSUMABLE REQUEST</span><h2>提交耗材申请</h2><p>{selected.service} · {selected.id}</p></div><button onClick={() => setRequestOpen(false)}><X size={19} /></button></div><div className="drawer-form"><label><span>申请类型</span><select value={requestType} onChange={(event) => setRequestType(event.target.value as typeof requestType)}><option>额外领用</option><option>退回</option><option>报损</option></select></label><label><span>耗材</span><select value={requestConsumableId} onChange={(event) => setRequestConsumableId(event.target.value)}>{consumables.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.unit}</option>)}</select></label><label><span>数量</span><input type="number" min="0.1" step="0.1" value={requestQuantity} onChange={(event) => setRequestQuantity(Number(event.target.value))} /></label><label><span>原因说明</span><textarea value={requestReason} maxLength={300} onChange={(event) => setRequestReason(event.target.value)} placeholder="请说明额外领用、退回或报损原因" /></label></div><p className="stock-tip">提交后由店长审批，通过后才会变更门店库存。</p><button className="drawer-primary drawer-submit" disabled={requestQuantity <= 0 || requestReason.trim().length < 2} onClick={submitConsumableRequest}><Check size={17} />提交店长审批</button></aside></>}
      {composer && <><button className="commerce-scrim" onClick={() => setComposer(false)} aria-label="关闭代客预约" /><aside className="commerce-drawer appointment-composer">
        <div className="drawer-head"><div><span>ASSISTED BOOKING</span><h2>代客预约</h2><p>录入电话、微信或到店咨询预约</p></div><button onClick={() => setComposer(false)}><X size={19} /></button></div>
        <div className="drawer-form">
          <label><span>预约门店</span><select value={formStoreId} disabled={isReceptionist} onChange={(event) => { const storeId = event.target.value; const service = services.find((item) => item.merchantId === DEMO_CONTEXT.merchantId && item.isOnline && item.bookingEnabled && item.storeIds?.includes(storeId)); const employee = staff.find((member) => member.storeId === storeId && member.status === "在职" && service && member.serviceIds.includes(service.id)); setFormStoreId(storeId); setFormServiceId(service?.id ?? ""); setFormEmployeeId(employee?.id ?? ""); setFormError(""); }}>{stores.filter((store) => store.status === "营业中" && (!isReceptionist || store.id === selectedStoreId)).map((store) => <option value={store.id} key={store.id}>{store.name}</option>)}</select></label>
          <label><span>预约会员</span><select value={formCustomerId} onChange={(event) => { setFormCustomerId(event.target.value); setFormError(""); }}>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name} · {customer.phone}</option>)}</select></label>
          <label><span>服务项目</span><select value={formService?.id ?? ""} onChange={(event) => { const serviceId = event.target.value; const employee = staff.find((member) => member.storeId === formStoreId && member.status === "在职" && member.serviceIds.includes(serviceId)); setFormServiceId(serviceId); setFormEmployeeId(employee?.id ?? ""); setFormError(""); }}>{formServices.map((service) => <option value={service.id} key={service.id}>{service.name} · ¥{service.price}</option>)}</select></label>
          <label><span>服务员工</span><select value={formEmployee?.id ?? ""} onChange={(event) => { setFormEmployeeId(event.target.value); setFormError(""); }} disabled={!formEmployees.length}>{formEmployees.length ? formEmployees.map((member) => <option value={member.id} key={member.id}>{member.name} · {member.title}</option>) : <option value="">暂无匹配员工</option>}</select></label>
          <label><span>预约日期</span><select value={formDate} onChange={(event) => { setFormDate(event.target.value); setFormError(""); }}>{availableDates.map((date) => <option value={date.value} key={date.value}>{formatDate(date.value)} · {date.week}</option>)}</select></label>
          <fieldset className="assisted-time-field"><legend>可预约时段</legend><div className="booking-time-options">{bookingTimes.map((time) => { const unavailable = unavailableFormTimes.includes(time); return <button type="button" disabled={unavailable} className={formTime === time && !unavailable ? "selected" : ""} key={time} onClick={() => { setFormTime(time); setFormError(""); }}>{time}{unavailable && <small>不可约</small>}</button>; })}</div></fieldset>
          <label><span>预约备注（选填）</span><textarea value={formNote} maxLength={80} onChange={(event) => setFormNote(event.target.value)} placeholder="记录顾客需求、来源或注意事项" /></label>
        </div>
        {formError && <div className="booking-error assisted-booking-error">{formError}</div>}
        <div className="drawer-summary"><span>到店支付</span><strong>¥{formService?.price ?? 0}</strong></div>
        <button className="drawer-primary" disabled={!formStore || !formCustomer || !formService || !formEmployee || unavailableFormTimes.includes(formTime)} onClick={submitAppointment}><Check size={17} /> 确认并创建预约</button>
      </aside></>}
    </>
  );
}

interface CustomerBookingProps {
  onBack: () => void;
  onChooseStore: () => void;
  selectedStore: MarketplaceStore | null;
  bookingOffer: BookingOffer | null;
}

export function CustomerBooking({ onBack, onChooseStore, selectedStore, bookingOffer }: CustomerBookingProps) {
  const addAppointment = useAppointments((state) => state.addAppointment);
  const validateBooking = useAppointments((state) => state.validateBooking);
  const updateStatus = useAppointments((state) => state.updateStatus);
  const allAppointments = useAppointments((state) => state.appointments);
  const services = useOperations((state) => state.services);
  const operationStaff = useOperations((state) => state.staff);
  const coupons = useCustomerMarketing((state) => state.coupons);
  const claimedCouponIds = useCustomerMarketing((state) => state.claimedCouponIds);
  const usedCouponIds = useCustomerMarketing((state) => state.usedCouponIds);
  const couponLocks = useCustomerMarketing((state) => state.couponLocks);
  const lockCoupon = useCustomerMarketing((state) => state.lockCoupon);
  const customerAppointments = useMemo(() => allAppointments.filter((item) => (
    (item.customerId ? item.customerId === DEMO_CONTEXT.customerId : item.customer === DEMO_CONTEXT.customerName)
    && (item.merchantId ? item.merchantId === DEMO_CONTEXT.merchantId : customerBrandStores.some((store) => item.store.includes(store.name)))
  )), [allAppointments]);
  const availableServices = selectedStore ? services.filter((item) => (
    item.merchantId === selectedStore.merchantId
    && item.storeIds?.includes(selectedStore.id)
    && item.isOnline
    && item.bookingEnabled
  )) : services.filter((item) => item.merchantId === DEMO_CONTEXT.merchantId && item.isOnline && item.bookingEnabled);
  const activityOffer = bookingOffer?.activityId ? bookingOffer : null;
  const initialServiceId = bookingOffer?.serviceId ?? availableServices[0]?.id ?? "";
  const [mode, setMode] = useState<"list" | "booking" | "success">(selectedStore ? "booking" : "list");
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState(initialServiceId);
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState(bookingDates[1].value);
  const [time, setTime] = useState("14:30");
  const [note, setNote] = useState("");
  const [created, setCreated] = useState<Appointment | null>(null);
  const [bookingError, setBookingError] = useState("");
  const [couponId, setCouponId] = useState(() => {
    if (activityOffer || !selectedStore) return "";
    return bestCoupon(
      coupons.filter((coupon) => claimedCouponIds.includes(coupon.id) && !usedCouponIds.includes(coupon.id) && !couponLocks[coupon.id]),
      initialServiceId,
      selectedStore.id,
      availableServices.find((item) => item.id === initialServiceId)?.price ?? 0,
    )?.id ?? "";
  });
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const service = availableServices.find((item) => item.id === serviceId) ?? availableServices[0];
  const availableEmployees = operationStaff.filter((item) => item.status === "在职" && (!selectedStore || item.storeId === selectedStore.id) && item.serviceIds.includes(service.id));
  const employee = availableEmployees.find((item) => item.id === employeeId) ?? null;
  const originalPrice = activityOffer?.price ?? service.price;
  const applicableCoupons = activityOffer || !selectedStore ? [] : coupons.filter((coupon) => claimedCouponIds.includes(coupon.id) && !usedCouponIds.includes(coupon.id) && !couponLocks[coupon.id] && isCouponApplicable(coupon, service.id, selectedStore.id, service.price));
  const selectedCoupon = applicableCoupons.find((coupon) => coupon.id === couponId) ?? null;
  const discountAmount = selectedCoupon ? couponDiscount(selectedCoupon, service.price) : 0;
  const bookingPrice = originalPrice - discountAmount;
  const recommendedServices = selectedStore ? availableServices.filter((item) => item.id !== service.id).slice(0, 2) : [];
  const createInput = (slot: string, assignedEmployee = employee) => selectedStore && assignedEmployee ? {
    merchantId: selectedStore.merchantId,
    storeId: selectedStore.id,
    customerId: DEMO_CONTEXT.customerId,
    serviceId: service.id,
    employeeId: assignedEmployee.id,
    activityId: activityOffer?.activityId,
    couponId: selectedCoupon?.id,
    originalPrice: service.price,
    discountAmount,
    date,
    time: slot,
    customer: DEMO_CONTEXT.customerName,
    phone: DEMO_CONTEXT.customerPhone,
    service: service.name,
    employee: assignedEmployee.name,
    store: `${selectedStore.merchantName} · ${selectedStore.name}`,
    duration: service.duration,
    price: bookingPrice,
    note,
  } : null;
  const assignedEmployeeForSlot = (slot: string) => {
    if (employee) {
      const input = createInput(slot, employee);
      return input && !validateBooking(input) ? employee : null;
    }
    return availableEmployees.find((candidate) => {
      const input = createInput(slot, candidate);
      return input && !validateBooking(input);
    }) ?? null;
  };
  const unavailableTimes = bookingTimes.filter((slot) => !assignedEmployeeForSlot(slot));
  const selectService = (nextServiceId: string) => {
    setServiceId(nextServiceId);
    setEmployeeId("");
    if (!selectedStore || activityOffer) {
      setCouponId("");
      return;
    }
    const nextService = availableServices.find((item) => item.id === nextServiceId);
    setCouponId(nextService ? bestCoupon(
      coupons.filter((coupon) => claimedCouponIds.includes(coupon.id) && !usedCouponIds.includes(coupon.id) && !couponLocks[coupon.id]),
      nextService.id,
      selectedStore.id,
      nextService.price,
    )?.id ?? "" : "");
  };

  const submit = () => {
    if (!selectedStore) return;
    const assignedEmployee = assignedEmployeeForSlot(time);
    const input = createInput(time, assignedEmployee);
    if (!input) return;
    const validationError = validateBooking(input);
    if (validationError) {
      setBookingError(validationError);
      return;
    }
    const result = addAppointment(input);
    if (!result) {
      setBookingError("这个时段刚刚被预约，请重新选择。");
      return;
    }
    if (selectedCoupon && !lockCoupon(selectedCoupon.id, result.id)) {
      updateStatus(result.id, "已取消");
      setBookingError("优惠券已被其他预约占用，请重新选择。");
      return;
    }
    setBookingError("");
    setCreated(result);
    setMode("success");
  };

  if (mode === "success" && created) {
    return <div className="customer-app booking-app booking-success-app">
      <header className="booking-success-head"><span><Check size={27} /></span><div><small>预约申请已提交</small><h1>等待门店确认</h1><p>确认结果将通过平台消息通知你</p></div></header>
      <section className="booking-confirm-notice"><Clock3 size={17} /><div><strong>预计 10 分钟内确认</strong><span>如预约时间有调整，门店会与你联系</span></div></section>
      <section className="booking-receipt">
        <div className="booking-receipt-title"><span>预约凭证</span><small>{created.id}</small></div>
        <div className="booking-receipt-time"><CalendarDays size={21} /><div><small>到店时间</small><strong>{formatDate(created.date)} · {created.time}</strong></div></div>
        <dl><div><dt>预约门店</dt><dd>{created.store}</dd></div><div><dt>服务项目</dt><dd>{created.service}</dd></div><div><dt>服务员工</dt><dd>{created.employee}</dd></div><div><dt>服务时长</dt><dd>{created.duration} 分钟</dd></div><div><dt>到店支付</dt><dd>¥{created.price}</dd></div></dl>
      </section>
      <section className="booking-success-actions"><button className="mobile-primary" onClick={() => { setMode("list"); setStep(1); }}>查看我的预约<ArrowRight size={17} /></button><div><button onClick={onBack}><MapPin size={15} />查看门店</button><button onClick={onChooseStore}>继续逛逛</button></div></section>
      {recommendedServices.length > 0 && <section className="success-recommendations"><div><h2>为你推荐</h2><span>同店可预约</span></div>{recommendedServices.map((item) => <button key={item.id} onClick={() => { selectService(item.id); setStep(1); setCreated(null); setMode("booking"); }}><span className={item.tone}><Sparkles size={18} /></span><div><strong>{item.name}</strong><small>{item.category} · {item.duration} 分钟</small></div><b>¥{item.price}</b><ChevronRight size={16} /></button>)}</section>}
      <p className="booking-success-tip">到店前如需取消或改期，请在“我的预约”中操作</p>
    </div>;
  }

  if (mode === "list") {
    const sorted = [...customerAppointments].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
    return <div className="customer-app booking-app">
      <header className="booking-header"><button onClick={onBack}><ArrowLeft size={20} /></button><h1>我的预约</h1><span /></header>
      <button className="new-booking-card" onClick={() => selectedStore ? setMode("booking") : onChooseStore()}><span><CalendarDays size={23} /></span><div><strong>预约新的服务</strong><small>选择栖光门店、服务项目与到店时间</small></div><ArrowRight size={19} /></button>
      <section className="customer-booking-list"><h2>预约记录</h2>{sorted.map((item) => <button className="customer-booking-entry" key={item.id} onClick={() => setSelectedAppointment(item)}><div className="booking-date-box"><strong>{item.date.slice(8)}</strong><span>{formatDate(item.date).slice(0, 2)}</span></div><div><AppointmentStatusBadge value={item.status} /><h3>{item.service}</h3><p>{item.time} · {item.employee} · {item.store}</p></div><ChevronRight size={17} /></button>)}</section>
      {selectedAppointment && <><button className="commerce-scrim" aria-label="关闭预约详情" onClick={() => setSelectedAppointment(null)} /><aside className="customer-detail-sheet"><div className="drawer-head"><div><span>APPOINTMENT {selectedAppointment.id}</span><h2>预约详情</h2><p>{formatDate(selectedAppointment.date)} · {selectedAppointment.time}</p></div><button aria-label="关闭" onClick={() => setSelectedAppointment(null)}><X size={19} /></button></div><div className="customer-appointment-state"><AppointmentStatusBadge value={selectedAppointment.status} /><strong>{selectedAppointment.service}</strong><span>{selectedAppointment.store}</span></div><dl className="customer-detail-list"><div><dt>服务员工</dt><dd>{selectedAppointment.employee}</dd></div><div><dt>服务时长</dt><dd>{selectedAppointment.duration} 分钟</dd></div><div><dt>到店时间</dt><dd>{selectedAppointment.date} {selectedAppointment.time}</dd></div><div><dt>到店支付</dt><dd>¥{selectedAppointment.price}</dd></div>{selectedAppointment.note && <div><dt>预约备注</dt><dd>{selectedAppointment.note}</dd></div>}</dl>{["待确认", "已确认"].includes(selectedAppointment.status) ? <button className="customer-cancel-appointment" onClick={() => { const updated = updateStatus(selectedAppointment.id, "已取消"); if (updated) setSelectedAppointment(updated); }}>取消预约</button> : <p className="customer-detail-note">当前预约状态无需操作，如有问题请联系门店。</p>}</aside></>}
    </div>;
  }

  return (
    <div className="customer-app booking-app booking-flow-app">
      <header className="booking-header"><button onClick={() => step === 1 ? onBack() : setStep(step - 1)}><ArrowLeft size={20} /></button><h1>预约服务</h1><span>{step}/3</span></header>
      <button className="booking-store-banner" onClick={onChooseStore}><MapPin size={17} /><span><small>预约门店</small><strong>{selectedStore?.merchantName} · {selectedStore?.name}</strong></span><ChevronRight size={16} /></button>
      {activityOffer && <section className="booking-offer-banner"><span><Timer size={18} /></span><div><small>已享活动优惠</small><strong>{activityOffer.title}</strong><p>服务项目和活动价已为你锁定</p></div><b>¥{activityOffer.price}</b></section>}
      <div className="booking-progress"><i className={step >= 1 ? "active" : ""} /><i className={step >= 2 ? "active" : ""} /><i className={step >= 3 ? "active" : ""} /></div>

      {step === 1 && <section className="booking-step"><div className="step-copy"><span>第一步</span><h2>{activityOffer ? "确认活动项目" : "选择服务项目"}</h2><p>{activityOffer ? "该活动仅适用于以下服务项目。" : "以下项目由当前门店提供，适用优惠券会自动匹配。"}</p></div><div className="service-options">{availableServices.filter((item) => !activityOffer || item.id === activityOffer.serviceId).map((item) => <button className={serviceId === item.id ? "selected" : ""} disabled={Boolean(activityOffer)} key={item.id} onClick={() => selectService(item.id)}><span className={`service-option-icon ${item.tone}`}><Sparkles size={22} /></span><span><small>{item.category}</small><strong>{item.name}</strong><em><Clock3 size={13} />{item.duration} 分钟</em></span><b>¥{activityOffer?.price ?? item.price}</b>{serviceId === item.id && <i><Check size={13} /></i>}</button>)}</div></section>}

      {step === 2 && <section className="booking-step"><div className="step-copy"><span>第二步</span><h2>选择服务员工</h2><p>可指定熟悉的员工，也可以由门店智能安排。</p></div>{availableEmployees.length ? <><button className={`employee-option no-preference ${!employeeId ? "selected" : ""}`} onClick={() => setEmployeeId("")}><span><UserRound size={21} /></span><div><strong>不指定员工</strong><small>系统按所选时段自动安排可服务员工</small></div>{!employeeId && <i><Check size={14} /></i>}</button><div className="employee-options">{availableEmployees.map((item) => <button className={employeeId === item.id ? "selected" : ""} key={item.id} onClick={() => setEmployeeId(item.id)}><span className={`employee-avatar employee-${item.id}`}>{item.name.slice(0, 1)}</span><div><strong>{item.name}</strong><small>{item.title} · 专业认证</small></div>{employeeId === item.id && <i><Check size={14} /></i>}</button>)}</div></> : <div className="plain-empty">当前项目暂无可预约员工，请联系门店安排。</div>}</section>}

      {step === 3 && <section className="booking-step"><div className="step-copy"><span>第三步</span><h2>选择到店时间</h2><p>{employee ? "已为你过滤该员工不可用时段。" : "仅展示至少有一位员工可服务的时段。"}</p></div><div className="selected-summary"><Sparkles size={19} /><div><strong>{service.name}</strong><small>{employee ? employee.name : "不指定员工 · 系统智能安排"} · {service.duration} 分钟</small></div><span>¥{bookingPrice}</span></div>{applicableCoupons.length > 0 && <><h3 className="picker-label">优惠券</h3><div className="booking-coupon-options"><button className={`coupon-option coupon-none ${!couponId ? "selected" : ""}`} onClick={() => setCouponId("")}><span className="coupon-choice-icon"><Check size={12} /></span><span className="coupon-option-copy"><strong>不使用优惠券</strong><small>按项目原价结算</small></span></button>{applicableCoupons.map((coupon) => <button className={`coupon-option ${couponId === coupon.id ? "selected" : ""}`} key={coupon.id} onClick={() => setCouponId(coupon.id)}><span className="coupon-ticket-icon"><TicketPercent size={18} /></span><span className="coupon-option-copy"><strong>{coupon.title}</strong><small>{coupon.description}</small></span><span className="coupon-option-side"><i className="coupon-choice-icon"><Check size={12} /></i><b>-¥{couponDiscount(coupon, service.price)}</b></span></button>)}</div></>}<h3 className="picker-label">预约日期</h3><div className="booking-date-options">{bookingDates.map((item) => <button className={date === item.value ? "selected" : ""} key={item.value} onClick={() => { setDate(item.value); setBookingError(""); }}><span>{item.week}</span><strong>{item.day}</strong></button>)}</div><h3 className="picker-label">可选时段</h3><div className="booking-time-options">{bookingTimes.map((item) => { const unavailable = unavailableTimes.includes(item); return <button disabled={unavailable} className={time === item && !unavailable ? "selected" : ""} key={item} onClick={() => { setTime(item); setBookingError(""); }}>{item}{unavailable && <small>已约</small>}</button>; })}</div>{bookingError && <div className="booking-error">{bookingError}</div>}<label className="booking-note"><span>到店备注（选填）</span><textarea value={note} maxLength={60} onChange={(event) => setNote(event.target.value)} placeholder="如有特殊需求，请提前告诉我们" /></label></section>}

      <footer className="booking-footer"><div><small>{step === 3 ? selectedCoupon ? `已优惠 ¥${discountAmount}` : "到店支付" : "已选项目"}</small><strong>{step === 3 ? `¥${bookingPrice} · ${service.name}` : service.name}</strong></div><button disabled={!availableEmployees.length || (step === 3 && unavailableTimes.includes(time))} onClick={() => step < 3 ? setStep(step + 1) : submit()}>{step < 3 ? "下一步" : "确认预约"}<ArrowRight size={17} /></button></footer>
    </div>
  );
}
