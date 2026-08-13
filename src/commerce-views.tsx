import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Coins,
  CreditCard,
  FileText,
  HelpCircle,
  History,
  LogOut,
  MessageCircle,
  Phone,
  Plus,
  QrCode,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  TicketPercent,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { DEMO_CONTEXT, DEMO_TODAY } from "./demo-context";
import { useAppointments, useCommerce, useCustomerMarketing, useMerchantScope, useOperations } from "./store";
import { couponValueText } from "./marketing-utils";
import type { Customer, Order, PaymentMethod } from "./types";

const currency = (value: number) => `¥${value.toLocaleString("zh-CN")}`;

function Level({ value }: { value: Customer["level"] }) {
  return <span className={`member-level level-${value}`}>{value}</span>;
}

export function CustomerCenter() {
  const customers = useCommerce((state) => state.customers);
  const orders = useCommerce((state) => state.orders);
  const cards = useCommerce((state) => state.customerCards);
  const saveCustomer = useCommerce((state) => state.saveCustomer);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(customers[0]?.id ?? "");
  const [draft, setDraft] = useState<Customer | null>(null);
  const filtered = customers.filter((customer) => `${customer.name}${customer.phone}${customer.tags.join("")}`.includes(query));
  const selected = customers.find((customer) => customer.id === selectedId) ?? filtered[0];
  const customerOrders = orders.filter((order) => order.customerId === selected?.id);
  const customerCards = cards.filter((card) => card.customerId === selected?.id);
  const openNew = () => setDraft({ id: `C${Date.now()}`, name: "", phone: "", level: "普通会员", tags: [], totalSpend: 0, visits: 0, lastVisit: DEMO_CONTEXT.customerId ? "2026-08-13" : "", joinedAt: "2026-08-13", note: "" });
  const submit = () => {
    if (!draft?.name.trim() || !draft.phone.trim()) return;
    saveCustomer({ ...draft, name: draft.name.trim(), phone: draft.phone.trim(), tags: draft.tags.filter(Boolean) });
    setSelectedId(draft.id);
    setDraft(null);
  };

  return <>
    <div className="page-heading"><div><span className="date-line">CUSTOMER CRM</span><h1>会员中心</h1><p>集中查看会员消费、到店和卡项资产。</p></div><button className="primary-action" onClick={openNew}><Plus size={17} /> 新增会员</button></div>
    <section className="crm-layout">
      <article className="panel customer-directory">
        <div className="directory-head"><div className="inline-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索姓名、手机或标签" /></div><span>{filtered.length} 位会员</span></div>
        <div className="customer-list-head"><span>会员</span><span>累计消费</span><span>最近到店</span></div>
        <div className="customer-list">{filtered.map((customer) => <button className={selected?.id === customer.id ? "selected" : ""} key={customer.id} onClick={() => setSelectedId(customer.id)}><span className="customer-avatar">{customer.name.slice(0, 1)}</span><span><strong>{customer.name}</strong><small>{customer.phone}</small></span><strong>{currency(customer.totalSpend)}</strong><small>{customer.lastVisit.slice(5).replace("-", "/")}</small></button>)}</div>
      </article>
      {selected && <aside className="panel customer-profile">
        <div className="profile-head"><span className="profile-avatar">{selected.name.slice(0, 1)}</span><div><h2>{selected.name}</h2><p><Phone size={13} /> {selected.phone}</p></div><Level value={selected.level} /><button className="profile-edit" onClick={() => setDraft({ ...selected, tags: [...selected.tags] })}>编辑资料</button></div>
        <div className="tag-line">{selected.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        <div className="profile-stats"><div><strong>{selected.visits}</strong><span>到店次数</span></div><div><strong>{currency(selected.totalSpend)}</strong><span>累计消费</span></div><div><strong>{customerCards.reduce((sum, card) => sum + card.remainingTimes, 0)}</strong><span>剩余卡次</span></div></div>
        <section className="profile-section"><div className="profile-section-head"><h3>持有次卡</h3><button>管理卡项</button></div>{customerCards.length ? customerCards.map((card) => <div className="mini-card" key={card.id}><span><WalletCards size={17} /></span><div><strong>{card.name}</strong><small>有效期至 {card.expiresAt}</small></div><b>{card.remainingTimes}<small>/{card.totalTimes}</small></b></div>) : <p className="plain-empty">暂无有效卡项</p>}</section>
        <section className="profile-section"><div className="profile-section-head"><h3>最近订单</h3><button>全部记录</button></div>{customerOrders.slice(0, 3).map((order) => <div className="mini-order" key={order.id}><div><strong>{order.service}</strong><small>{order.createdAt} · {order.employee}</small></div><span>{order.paymentMethod || "待结算"}<b>{currency(order.payable)}</b></span></div>)}</section>
        {selected.note && <div className="customer-note"><span>服务备注</span><p>{selected.note}</p></div>}
      </aside>}
    </section>
    {draft && <><button className="commerce-scrim" onClick={() => setDraft(null)} aria-label="关闭" /><aside className="commerce-drawer"><div className="drawer-head"><div><span>CUSTOMER PROFILE</span><h2>{customers.some((item) => item.id === draft.id) ? "编辑会员" : "新增会员"}</h2></div><button onClick={() => setDraft(null)}><X size={19} /></button></div><div className="drawer-form"><label><span>会员姓名</span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="请输入会员姓名" /></label><label><span>手机号码</span><input value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} placeholder="请输入手机号" /></label><label><span>会员等级</span><select value={draft.level} onChange={(event) => setDraft({ ...draft, level: event.target.value as Customer["level"] })}><option>普通会员</option><option>银卡会员</option><option>金卡会员</option></select></label><label><span>会员标签（用逗号分隔）</span><input value={draft.tags.join(",")} onChange={(event) => setDraft({ ...draft, tags: event.target.value.split(/[,，]/).map((tag) => tag.trim()) })} placeholder="例如：高复购,肩颈护理" /></label><label><span>服务备注</span><textarea value={draft.note ?? ""} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder="记录偏好、禁忌和跟进事项" /></label></div><button className="drawer-primary drawer-submit" disabled={!draft.name.trim() || !draft.phone.trim()} onClick={submit}><Check size={17} /> 保存会员资料</button></aside></>}
  </>;
}

export function OrderCenter({ cashier = false, title, autoOpenComposer = cashier }: { cashier?: boolean; title?: string; autoOpenComposer?: boolean }) {
  const selectedStoreId = useMerchantScope((state) => state.selectedStoreId);
  const stores = useOperations((state) => state.stores);
  const services = useOperations((state) => state.services).filter((item) => item.merchantId === DEMO_CONTEXT.merchantId && item.isOnline && (!selectedStoreId || item.storeIds?.includes(selectedStoreId)));
  const serviceEmployees = useOperations((state) => state.staff).filter((item) => item.role === "员工" && item.status === "在职" && (!selectedStoreId || item.storeId === selectedStoreId));
  const customers = useCommerce((state) => state.customers);
  const orders = useCommerce((state) => state.orders);
  const cards = useCommerce((state) => state.customerCards);
  const createWalkInOrder = useCommerce((state) => state.createWalkInOrder);
  const settleOrder = useCommerce((state) => state.settleOrder);
  const [selectedId, setSelectedId] = useState<string | null>(autoOpenComposer ? orders.find((order) => order.status === "待结算")?.id ?? null : null);
  const [composer, setComposer] = useState(autoOpenComposer);
  const [status, setStatus] = useState<"全部" | Order["status"]>(cashier ? "待结算" : "全部");
  const [query, setQuery] = useState("");
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [employeeId, setEmployeeId] = useState(serviceEmployees[0]?.id ?? "");
  const [discount, setDiscount] = useState(() => orders.find((order) => order.status === "待结算")?.discount ?? 0);
  const [payment, setPayment] = useState<PaymentMethod>("微信");
  const [cardId, setCardId] = useState("");
  const selected = orders.find((order) => order.id === selectedId && (!selectedStoreId || order.storeId === selectedStoreId)) ?? null;
  const scopedOrders = orders.filter((order) => !selectedStoreId || order.storeId === selectedStoreId);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleOrders = scopedOrders
    .filter((order) => status === "全部" || order.status === status)
    .filter((order) => {
      if (!normalizedQuery) return true;
      const customerPhone = customers.find((customer) => customer.id === order.customerId)?.phone ?? "";
      return `${order.id}${order.customer}${customerPhone}${order.service}${order.employee}`.toLowerCase().includes(normalizedQuery);
    });
  const matchingCards = cards.filter((card) => card.customerId === selected?.customerId && card.service === selected?.service && card.remainingTimes > 0 && card.status === "使用中");
  const completedRevenue = scopedOrders.filter((order) => order.status === "已完成").reduce((sum, order) => sum + order.payable, 0);

  const openOrder = (order: Order) => {
    setSelectedId(order.id);
    setDiscount(order.discount);
    setPayment(order.paymentMethod ?? "微信");
  };

  const addOrder = () => {
    const customer = customers.find((item) => item.id === customerId);
    const service = services.find((item) => item.id === serviceId);
    const store = stores.find((item) => item.id === selectedStoreId) ?? stores[0];
    const employee = serviceEmployees.find((item) => item.id === employeeId);
    if (!customer || !service || !store || !employee) return;
    const order = createWalkInOrder({ customerId, customer: customer.name, service: service.name, serviceId: service.id, employee: employee.name, employeeId: employee.id, store: store.name, storeId: store.id, amount: service.price });
    openOrder(order);
    setComposer(false);
  };

  const settle = () => {
    if (!selected) return;
    if (settleOrder(selected.id, payment, discount, payment === "次卡" ? cardId : undefined)) setSelectedId(null);
  };

  return <>
    <div className="page-heading"><div><span className="date-line">ORDER & CASHIER</span><h1>{title ?? (cashier ? "开单收银" : "订单管理")}</h1><p>服务开单、支付登记和次卡核销统一处理。</p></div><button className="primary-action" onClick={() => setComposer(true)}><Plus size={17} /> 新建订单</button></div>
    <section className="order-stats"><div><span>今日实收</span><strong>{currency(completedRevenue)}</strong><small>含微信、支付宝与现金</small></div><div><span>待结算</span><strong>{scopedOrders.filter((order) => order.status === "待结算").length} 单</strong><small>服务完成后等待收银</small></div><div><span>次卡核销</span><strong>{scopedOrders.filter((order) => order.paymentMethod === "次卡").length} 次</strong><small>不计入当日现金收入</small></div></section>
    <article className="panel order-panel">
      <div className="order-toolbar"><div className="status-filter">{(["全部", "待结算", "已完成", "已退款"] as const).map((item) => <button className={status === item ? "active" : ""} key={item} onClick={() => setStatus(item)}>{item}</button>)}</div><div className="inline-search compact"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索订单号、会员或手机号" /></div></div>
      <div className="order-table order-table-head"><span>订单与项目</span><span>会员</span><span>服务员工</span><span>结算</span><span>金额</span><span>状态</span><span /></div>
      {visibleOrders.map((order) => <div className="order-table" key={order.id}><span><strong>{order.service}</strong><small>{order.id} · {order.createdAt}</small></span><span>{order.customer}</span><span>{order.employee}</span><span>{order.paymentMethod || "-"}</span><strong>{currency(order.payable)}</strong><span className={`order-status order-${order.status}`}>{order.status}</span><button onClick={() => openOrder(order)}>{order.status === "待结算" ? "去结算" : "详情"}</button></div>)}
    </article>

    {(composer || selected) && <div className="commerce-scrim" onClick={() => { setComposer(false); setSelectedId(null); }} />}
    {composer && <aside className="commerce-drawer"><div className="drawer-head"><div><span>WALK-IN ORDER</span><h2>新建到店订单</h2></div><button onClick={() => setComposer(false)}><X size={19} /></button></div><div className="drawer-form"><label><span>选择会员</span><select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name} · {customer.phone}</option>)}</select></label><label><span>服务项目</span><select value={serviceId} onChange={(event) => setServiceId(event.target.value)}>{services.map((service) => <option value={service.id} key={service.id}>{service.name} · ¥{service.price}</option>)}</select></label><label><span>服务员工</span><select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}>{serviceEmployees.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.title}</option>)}</select></label></div><div className="drawer-summary"><span>订单金额</span><strong>{currency(services.find((item) => item.id === serviceId)?.price ?? 0)}</strong></div><button className="drawer-primary" disabled={!customerId || !serviceId || !employeeId} onClick={addOrder}>创建并去结算 <ArrowRight size={17} /></button></aside>}

    {selected && !composer && <aside className="commerce-drawer"><div className="drawer-head"><div><span>ORDER {selected.id}</span><h2>{selected.status === "待结算" ? "订单结算" : "订单详情"}</h2></div><button onClick={() => setSelectedId(null)}><X size={19} /></button></div><div className="settle-customer"><span>{selected.customer.slice(0, 1)}</span><div><strong>{selected.customer}</strong><small>{selected.service} · {selected.employee}</small></div></div><dl className="settle-lines"><div><dt>项目原价</dt><dd>{currency(selected.amount)}</dd></div><div><dt>优惠金额</dt><dd>{currency(selected.discount)}</dd></div><div><dt>应收金额</dt><dd>{currency(selected.payable)}</dd></div></dl>{selected.status === "待结算" ? <><label className="discount-input"><span>本单优惠</span><input type="number" min="0" max={selected.amount} value={discount} onChange={(event) => setDiscount(Number(event.target.value))} /></label><div className="payment-options">{(["微信", "支付宝", "现金", "次卡"] as PaymentMethod[]).map((method) => <button className={payment === method ? "selected" : ""} key={method} onClick={() => { setPayment(method); if (method === "次卡") setCardId(matchingCards[0]?.id ?? ""); }}><span>{method === "次卡" ? <WalletCards size={20} /> : method === "现金" ? <Banknote size={20} /> : <CreditCard size={20} />}</span>{method}{payment === method && <i><Check size={12} /></i>}</button>)}</div>{payment === "次卡" && <div className="matching-card-list">{matchingCards.length ? matchingCards.map((card) => <button className={cardId === card.id ? "selected" : ""} key={card.id} onClick={() => setCardId(card.id)}><span><strong>{card.name}</strong><small>有效期至 {card.expiresAt}</small></span><b>剩 {card.remainingTimes} 次</b></button>) : <div className="no-matching-card">该会员没有可用于当前项目的次卡</div>}</div>}<div className="payable-total"><span>本次应收</span><strong>{payment === "次卡" ? "核销 1 次" : currency(Math.max(0, selected.amount - discount))}</strong></div><button className="drawer-primary" disabled={payment === "次卡" && !cardId} onClick={settle}><BadgeCheck size={17} /> 确认完成结算</button></> : <div className="settled-result"><BadgeCheck size={25} /><strong>订单已完成</strong><span>{selected.paymentMethod} · 实收 {currency(selected.payable)}</span></div>}</aside>}
  </>;
}

export function EmployeeCardRedemption() {
  const customers = useCommerce((state) => state.customers);
  const orders = useCommerce((state) => state.orders);
  const cards = useCommerce((state) => state.customerCards);
  const transactions = useCommerce((state) => state.cardTransactions);
  const redeemCardByEmployee = useCommerce((state) => state.redeemCardByEmployee);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const employeeId = DEMO_CONTEXT.employeeId;
  const pendingOrders = orders.filter((order) => order.employeeId === employeeId && order.status === "待结算");
  const selectedOrder = pendingOrders.find((order) => order.id === selectedOrderId) ?? null;
  const availableCards = (order: Order | null) => cards.filter((card) => card.customerId === order?.customerId && card.service === order?.service && card.remainingTimes > 0 && card.status === "使用中" && card.expiresAt >= DEMO_TODAY);
  const matchingCards = availableCards(selectedOrder);
  const employeeTransactions = transactions.filter((transaction) => transaction.type === "核销" && (transaction.employeeId === employeeId || (!transaction.employeeId && orders.find((order) => order.id === transaction.orderId)?.employeeId === employeeId)));
  const redeemableCount = pendingOrders.filter((order) => availableCards(order).length > 0).length;

  const openRedemption = (order: Order) => {
    const matching = availableCards(order);
    setSuccess(null);
    setSelectedOrderId(order.id);
    setSelectedCardId(matching[0]?.id ?? "");
  };

  const redeem = () => {
    if (!selectedOrder || !selectedCardId) return;
    const card = matchingCards.find((item) => item.id === selectedCardId);
    if (!card || !redeemCardByEmployee(selectedOrder.id, employeeId, card.id)) return;
    setSuccess(`${selectedOrder.customer} · ${selectedOrder.service}，卡内剩余 ${card.remainingTimes - 1} 次`);
    setSelectedOrderId(null);
    setSelectedCardId("");
  };

  return <>
    <div className="page-heading"><div><span className="date-line">CARD REDEMPTION</span><h1>次卡核销</h1><p>核销本人已完成服务对应的会员次卡。</p></div></div>
    {success && <section className="redemption-success"><BadgeCheck size={19} /><div><strong>核销成功</strong><span>{success}</span></div><button aria-label="关闭提示" onClick={() => setSuccess(null)}><X size={16} /></button></section>}
    <section className="redemption-metrics"><article><span><WalletCards size={18} /></span><div><strong>{redeemableCount}</strong><small>当前可核销</small></div></article><article><span><History size={18} /></span><div><strong>{employeeTransactions.length}</strong><small>累计核销记录</small></div></article></section>
    <section className="redemption-layout">
      <article className="panel redemption-panel"><div className="panel-head"><div><h2>待核销服务</h2><p>仅展示由你服务的待结算订单</p></div></div>{pendingOrders.length ? <div className="redemption-order-list">{pendingOrders.map((order) => { const customer = customers.find((item) => item.id === order.customerId); const matching = availableCards(order); return <article key={order.id}><span className="redemption-avatar">{order.customer.slice(0, 1)}</span><div><strong>{order.customer} · {order.service}</strong><small>{customer?.phone ?? "-"} · {order.createdAt}</small></div><span className={matching.length ? "redemption-ready" : "redemption-unavailable"}>{matching.length ? `可用 ${matching.reduce((sum, card) => sum + card.remainingTimes, 0)} 次` : "无匹配次卡"}</span><button disabled={!matching.length} onClick={() => openRedemption(order)}>核销</button></article>; })}</div> : <div className="redemption-empty"><BadgeCheck size={28} /><strong>当前没有待核销服务</strong><span>完成服务并生成订单后，会显示在这里。</span></div>}</article>
      <article className="panel redemption-history"><div className="panel-head"><div><h2>我的核销记录</h2><p>按核销时间倒序展示</p></div></div>{employeeTransactions.length ? employeeTransactions.map((transaction) => { const order = orders.find((item) => item.id === transaction.orderId); const customer = customers.find((item) => item.id === transaction.customerId); return <div key={transaction.id}><span><History size={16} /></span><div><strong>{customer?.name ?? order?.customer ?? "会员"} · {transaction.note}</strong><small>{transaction.createdAt} · {transaction.source ?? "门店核销"}</small></div><b>-1 次<small>余 {transaction.balance}</small></b></div>; }) : <div className="redemption-empty compact"><History size={24} /><strong>暂无核销记录</strong></div>}</article>
    </section>
    {selectedOrder && <><button className="commerce-scrim" aria-label="关闭核销确认" onClick={() => setSelectedOrderId(null)} /><aside className="commerce-drawer"><div className="drawer-head"><div><span>ORDER {selectedOrder.id}</span><h2>确认次卡核销</h2></div><button aria-label="关闭" onClick={() => setSelectedOrderId(null)}><X size={19} /></button></div><div className="settle-customer"><span>{selectedOrder.customer.slice(0, 1)}</span><div><strong>{selectedOrder.customer}</strong><small>{selectedOrder.service} · 服务员工 {selectedOrder.employee}</small></div></div><dl className="settle-lines"><div><dt>服务时间</dt><dd>{selectedOrder.createdAt}</dd></div><div><dt>核销项目</dt><dd>{selectedOrder.service}</dd></div><div><dt>本次扣减</dt><dd>1 次</dd></div></dl><div className="matching-card-list">{matchingCards.map((card) => <button className={selectedCardId === card.id ? "selected" : ""} key={card.id} onClick={() => setSelectedCardId(card.id)}><span><strong>{card.name}</strong><small>有效期至 {card.expiresAt}</small></span><b>剩 {card.remainingTimes} 次</b>{selectedCardId === card.id && <Check size={15} />}</button>)}</div><div className="redemption-confirm-note"><ShieldCheck size={16} /><span>确认后将扣减会员 1 次卡项，并以你的身份记录本次服务核销。</span></div><button className="drawer-primary" disabled={!selectedCardId} onClick={redeem}><BadgeCheck size={17} /> 确认核销 1 次</button></aside></>}
  </>;
}

export function CardCenter() {
  const products = useCommerce((state) => state.cardProducts);
  const customers = useCommerce((state) => state.customers);
  const cards = useCommerce((state) => state.customerCards);
  const transactions = useCommerce((state) => state.cardTransactions);
  const sellCard = useCommerce((state) => state.sellCard);
  const [productId, setProductId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState(customers[0].id);
  const activeCards = cards.filter((card) => card.status === "使用中");

  const sell = () => {
    if (productId && sellCard(customerId, productId)) setProductId(null);
  };

  return <>
    <div className="page-heading"><div><span className="date-line">MEMBERSHIP CARDS</span><h1>服务与次卡</h1><p>配置卡项产品，管理会员卡次与核销流水。</p></div><button className="primary-action"><Plus size={17} /> 新建卡项</button></div>
    <section className="card-product-grid">{products.map((product, index) => <article className={`card-product card-product-${index + 1}`} key={product.id}><div><span>{product.service}</span><h2>{product.name}</h2><p>{product.validDays} 天有效 · 到店核销</p></div><div><strong>{currency(product.price)}</strong><span>{product.totalTimes} 次</span></div><button onClick={() => setProductId(product.id)}>售卡 <ArrowRight size={16} /></button></article>)}</section>
    <section className="card-management-grid"><article className="panel"><div className="panel-head"><div><h2>会员卡项</h2><p>{activeCards.length} 张使用中</p></div><button className="text-button">查看全部 <ArrowRight size={15} /></button></div><div className="card-table card-table-head"><span>会员与卡项</span><span>剩余</span><span>有效期</span><span>状态</span></div>{activeCards.map((card) => { const customer = customers.find((item) => item.id === card.customerId); return <div className="card-table" key={card.id}><span><strong>{customer?.name}</strong><small>{card.name}</small></span><b>{card.remainingTimes}/{card.totalTimes}</b><span>{card.expiresAt}</span><i>{card.status}</i></div>; })}</article><article className="panel"><div className="panel-head"><div><h2>最近卡项流水</h2><p>购买、核销与调整记录</p></div></div><div className="transaction-list">{transactions.slice(0, 6).map((transaction) => { const customer = customers.find((item) => item.id === transaction.customerId); return <div key={transaction.id}><span className={`transaction-icon type-${transaction.type}`}>{transaction.type === "核销" ? <History size={16} /> : <ShoppingBag size={16} />}</span><div><strong>{customer?.name} · {transaction.note}</strong><small>{transaction.createdAt}</small></div><b>{transaction.change > 0 ? "+" : ""}{transaction.change}<small>余 {transaction.balance}</small></b></div>; })}</div></article></section>
    {productId && <><div className="commerce-scrim" onClick={() => setProductId(null)} /><aside className="commerce-drawer"><div className="drawer-head"><div><span>SELL MEMBERSHIP CARD</span><h2>销售次卡</h2></div><button onClick={() => setProductId(null)}><X size={19} /></button></div>{(() => { const product = products.find((item) => item.id === productId)!; return <><div className="sale-product"><WalletCards size={25} /><div><strong>{product.name}</strong><small>{product.service} · {product.totalTimes} 次</small></div><b>{currency(product.price)}</b></div><div className="drawer-form"><label><span>购买会员</span><select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name} · {customer.phone}</option>)}</select></label><label><span>有效期</span><input value={`购买后 ${product.validDays} 天`} disabled /></label></div><div className="drawer-summary"><span>收款金额</span><strong>{currency(product.price)}</strong></div><button className="drawer-primary" onClick={sell}>确认售卡 <ArrowRight size={17} /></button></>; })()}</aside></>}
  </>;
}

export function CustomerAssets() {
  const customers = useCommerce((state) => state.customers);
  const cards = useCommerce((state) => state.customerCards);
  const orders = useCommerce((state) => state.orders);
  const customer = customers.find((item) => item.id === DEMO_CONTEXT.customerId)!;
  const customerCards = cards.filter((card) => card.customerId === customer.id);
  const customerOrders = orders.filter((order) => order.customerId === customer.id && (!order.store || order.store.includes("云锦路店") || order.store.includes("湖滨路店")));
  const coupons = useCustomerMarketing((state) => state.coupons);
  const claimedCouponIds = useCustomerMarketing((state) => state.claimedCouponIds);
  const usedCouponIds = useCustomerMarketing((state) => state.usedCouponIds);
  const couponLocks = useCustomerMarketing((state) => state.couponLocks);
  const claimCoupon = useCustomerMarketing((state) => state.claimCoupon);
  const [tab, setTab] = useState<"优惠券" | "次卡" | "订单">("优惠券");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  return <div className="customer-app assets-app"><header className="assets-header"><div><span>栖光会员账户</span><h1>{customer.name}</h1><p>{customer.level} · 累计到店 {customer.visits} 次</p></div><span className="assets-avatar">{customer.name.slice(0, 1)}</span></header><div className="assets-tabs"><button className={tab === "优惠券" ? "active" : ""} onClick={() => setTab("优惠券")}>优惠券</button><button className={tab === "次卡" ? "active" : ""} onClick={() => setTab("次卡")}>我的次卡</button><button className={tab === "订单" ? "active" : ""} onClick={() => setTab("订单")}>消费订单</button></div>{tab === "优惠券" ? <section className="customer-coupon-list"><div className="coupon-account-summary"><span><TicketPercent size={18} /></span><div><strong>{claimedCouponIds.filter((id) => !usedCouponIds.includes(id) && !couponLocks[id]).length} 张可用</strong><small>预约服务时自动匹配最优惠方案</small></div></div>{coupons.map((coupon) => { const claimed = claimedCouponIds.includes(coupon.id); const used = usedCouponIds.includes(coupon.id); const locked = Boolean(couponLocks[coupon.id]); return <article className={used ? "used" : ""} key={coupon.id}><div className="coupon-value"><strong>{couponValueText(coupon)}</strong><span>{coupon.minSpend ? `满 ¥${coupon.minSpend} 可用` : "无门槛"}</span></div><div className="coupon-copy"><span>{coupon.label}</span><h2>{coupon.title}</h2><p>{coupon.description}</p><small>有效期至 {coupon.validUntil}</small></div><button disabled={claimed || used} onClick={() => claimCoupon(coupon.id)}>{used ? "已使用" : locked ? "预约占用" : claimed ? "已领取" : "领取"}</button></article>; })}</section> : tab === "次卡" ? <section className="customer-card-stack">{customerCards.map((card, index) => <article className={`customer-card customer-card-${index + 1}`} key={card.id}><div><span>{card.status}</span><WalletCards size={22} /></div><h2>{card.name}</h2><p>{card.service}</p><div><strong>{card.remainingTimes}<small>/{card.totalTimes} 次</small></strong><span>有效期至 {card.expiresAt}</span></div></article>)}</section> : <section className="asset-order-list">{customerOrders.map((order) => <button className="asset-order-entry" key={order.id} onClick={() => setSelectedOrder(order)}><span className="asset-order-icon"><FileText size={18} /></span><div><strong>{order.service}</strong><small>{order.createdAt} · {order.store}</small></div><span><b>{currency(order.payable)}</b><small>{order.paymentMethod || order.status}</small></span><ChevronRight size={16} /></button>)}</section>}{selectedOrder && <><button className="commerce-scrim" aria-label="关闭订单详情" onClick={() => setSelectedOrder(null)} /><aside className="customer-detail-sheet"><div className="drawer-head"><div><span>ORDER {selectedOrder.id}</span><h2>消费订单</h2><p>{selectedOrder.createdAt}</p></div><button aria-label="关闭" onClick={() => setSelectedOrder(null)}><X size={19} /></button></div><div className="customer-order-result"><BadgeCheck size={24} /><div><strong>{selectedOrder.service}</strong><span>{selectedOrder.status} · {selectedOrder.paymentMethod ?? "到店结算"}</span></div></div><dl className="customer-detail-list"><div><dt>服务门店</dt><dd>{selectedOrder.store}</dd></div><div><dt>服务员工</dt><dd>{selectedOrder.employee}</dd></div><div><dt>项目金额</dt><dd>{currency(selectedOrder.amount)}</dd></div><div><dt>优惠金额</dt><dd>{currency(selectedOrder.discount)}</dd></div><div><dt>实付金额</dt><dd>{currency(selectedOrder.payable)}</dd></div></dl></aside></>}</div>;
}

export function CustomerNotifications({ onBack }: { onBack: () => void }) {
  const messages = useCustomerMarketing((state) => state.messages);
  const markMessageRead = useCustomerMarketing((state) => state.markMessageRead);
  const markAllMessagesRead = useCustomerMarketing((state) => state.markAllMessagesRead);
  return <div className="customer-app message-app"><header className="message-header"><button onClick={onBack} aria-label="返回"><ArrowLeft size={19} /></button><h1>消息提醒</h1><button onClick={markAllMessagesRead}>全部已读</button></header><section className="message-list">{messages.map((message) => <button className={message.read ? "read" : ""} key={message.id} onClick={() => markMessageRead(message.id)}><span>{message.type === "预约提醒" ? <CalendarDays size={18} /> : message.type === "优惠到期" ? <TicketPercent size={18} /> : <Bell size={18} />}</span><div><strong>{message.title}</strong><p>{message.content}</p><small>{message.createdAt}</small></div>{!message.read && <i />}</button>)}</section></div>;
}

export function CustomerProfile({ onNavigate, onSwitchRole }: { onNavigate: (page: string) => void; onSwitchRole: () => void }) {
  const customers = useCommerce((state) => state.customers);
  const orders = useCommerce((state) => state.orders);
  const cards = useCommerce((state) => state.customerCards);
  const appointments = useAppointments((state) => state.appointments);
  const claimedCouponIds = useCustomerMarketing((state) => state.claimedCouponIds);
  const usedCouponIds = useCustomerMarketing((state) => state.usedCouponIds);
  const couponLocks = useCustomerMarketing((state) => state.couponLocks);
  const customer = customers.find((item) => item.id === DEMO_CONTEXT.customerId)!;
  const customerOrders = orders.filter((item) => item.customerId === customer.id && (!item.store || item.store.includes("云锦路店") || item.store.includes("湖滨路店")));
  const customerCards = cards.filter((item) => item.customerId === customer.id && item.status === "使用中");
  const customerAppointments = appointments.filter((item) => item.customerId === customer.id && item.merchantId === DEMO_CONTEXT.merchantId);
  const upcomingAppointment = [...customerAppointments]
    .filter((item) => !["已完成", "已取消", "未到店"].includes(item.status))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0];
  const remainingTimes = customerCards.reduce((sum, card) => sum + card.remainingTimes, 0);
  const availableCouponCount = claimedCouponIds.filter((id) => !usedCouponIds.includes(id) && !couponLocks[id]).length;
  const growthValue = Math.min(1000, Math.round(customer.totalSpend / 8));

  return <div className="customer-app profile-app">
    <header className="mobile-profile-head"><span className="mobile-profile-avatar">{customer.name.slice(0, 1)}</span><div><span>个人中心</span><h1>{customer.name}</h1><p>{customer.phone} · 已绑定手机号</p></div></header>
    <section className="platform-member-card">
      <div className="member-card-top"><div><span>栖光美学会员</span><h2>悦享会员</h2><p>品牌会员 · 栖光两店通用</p></div><QrCode size={24} /></div>
      <div className="member-growth"><div><span>成长值 {growthValue}</span><small>距升级还差 {1000 - growthValue}</small></div><i><b style={{ width: `${growthValue / 10}%` }} /></i></div>
      <div className="member-benefits">
        <button onClick={() => onNavigate("权益")}><span><TicketPercent size={17} /></span><strong>{availableCouponCount} 张券</strong><small>预约自动抵扣</small></button>
        <button onClick={() => onNavigate("首页")}><span><Tag size={17} /></span><strong>会员专享</strong><small>栖光门店优惠</small></button>
        <button onClick={() => onNavigate("预约")}><span><Clock3 size={17} /></span><strong>优先预约</strong><small>热门时段提醒</small></button>
      </div>
    </section>
    <section className="mobile-profile-stats"><button onClick={() => onNavigate("预约")}><strong>{customerAppointments.length}</strong><span>预约记录</span></button><button onClick={() => onNavigate("权益")}><strong>{remainingTimes}</strong><span>可用卡次</span></button><button onClick={() => onNavigate("权益")}><strong>{customerOrders.length}</strong><span>消费订单</span></button></section>
    {upcomingAppointment && <button className="profile-next-booking" onClick={() => onNavigate("预约")}><span><CalendarDays size={19} /></span><div><small>下一次预约</small><strong>{upcomingAppointment.date.slice(5).replace("-", "月")}日 {upcomingAppointment.time}</strong><p>{upcomingAppointment.service} · {upcomingAppointment.store}</p></div><ChevronRight size={17} /></button>}
    <div className="profile-group-title"><span>我的服务</span></div>
    <section className="profile-menu"><button onClick={() => onNavigate("预约")}><span><CalendarDays size={19} /></span><div><strong>我的预约</strong><small>查看栖光门店预约进度和记录</small></div><ChevronRight size={17} /></button><button onClick={() => onNavigate("权益")}><span><WalletCards size={19} /></span><div><strong>我的权益</strong><small>查看栖光次卡、积分和消费订单</small></div><ChevronRight size={17} /></button><button onClick={() => onNavigate("售后")}><span><History size={19} /></span><div><strong>售后服务</strong><small>申请售后并查看门店处理进度</small></div><ChevronRight size={17} /></button></section>
    <div className="profile-group-title"><span>账户与支持</span></div>
    <section className="profile-menu"><button onClick={() => window.alert(`当前演示会员：${customer.name}\n绑定手机：${customer.phone}\n会员等级：${customer.level}`)}><span><UserRound size={19} /></span><div><strong>账户与安全</strong><small>查看当前演示会员资料</small></div><ChevronRight size={17} /></button><button onClick={() => window.alert("栖光美学会员服务\n云锦路店：021-6888 1026\n湖滨路店：021-5668 2031\n服务时间：09:30 - 21:00")}><span><MessageCircle size={19} /></span><div><strong>联系栖光</strong><small>预约、卡项和退款问题</small></div><ChevronRight size={17} /></button><button onClick={() => window.alert("演示版本不会上传个人资料。\n会员、预约和订单数据仅保存在当前浏览器中，可在平台设置中恢复初始数据。")}><span><ShieldCheck size={19} /></span><div><strong>隐私与协议</strong><small>查看演示环境数据说明</small></div><ChevronRight size={17} /></button></section>
    <button className="profile-switch-role" onClick={onSwitchRole}><LogOut size={16} /><span><strong>切换体验身份</strong><small>返回角色选择页面</small></span><ChevronRight size={16} /></button>
  </div>;
}
