import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Download,
  FileClock,
  Filter,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  TrendingUp,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { employees } from "./data";
import { addDays, DEMO_CONTEXT, DEMO_TODAY } from "./demo-context";
import { useAppointments, useCommerce, useMerchantScope, useOperations, usePlatform } from "./store";
import type { Order, PaymentMethod, Role, SaaSPlan, Tenant, TenantStatus } from "./types";

const currency = (value: number) => `¥${value.toLocaleString("zh-CN")}`;

function Metric({ label, value, detail, icon: Icon, tone, onClick }: { label: string; value: string; detail: string; icon: typeof TrendingUp; tone: string; onClick?: () => void }) {
  if (onClick) return <button className="report-metric report-metric-action" onClick={onClick}><span className={`metric-icon ${tone}`}><Icon size={18} /></span><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div><ArrowRight className="metric-chevron" size={15} /></button>;
  return <article className="report-metric"><span className={`metric-icon ${tone}`}><Icon size={18} /></span><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article>;
}

function TrendChart({ values, labels, formatValue = currency }: { values: number[]; labels?: string[]; formatValue?: (value: number) => string }) {
  const max = Math.max(...values, 1);
  return <div className="report-chart"><div className="chart-grid"><i /><i /><i /><i /></div><div className="report-bars">{values.map((value, index) => <div key={`${labels?.[index] ?? index}-${index}`}><span style={{ height: `${Math.max(8, (value / max) * 100)}%` }}><b>{formatValue(value)}</b></span><small>{labels?.[index] ?? ["8/7", "8/8", "8/9", "8/10", "8/11", "8/12", "今天"][index]}</small></div>)}</div></div>;
}

type ReportPeriod = "近 7 天" | "本月" | "上月" | "自定义";
type ReportMetric = "revenue" | "orders" | "average" | "customers";
type PaymentFilter = "全部" | PaymentMethod;

const monthStart = (date: string) => `${date.slice(0, 7)}-01`;
const previousMonthRange = (date: string) => {
  const first = new Date(`${monthStart(date)}T00:00:00`);
  first.setMonth(first.getMonth() - 1);
  const start = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, "0")}-01`;
  const endDate = new Date(`${monthStart(date)}T00:00:00`);
  endDate.setDate(0);
  const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
  return { start, end };
};
const reportRange = (period: ReportPeriod, customStart: string, customEnd: string) => {
  if (period === "近 7 天") return { start: addDays(DEMO_TODAY, -6), end: DEMO_TODAY };
  if (period === "上月") return previousMonthRange(DEMO_TODAY);
  if (period === "自定义") return { start: customStart, end: customEnd };
  return { start: monthStart(DEMO_TODAY), end: DEMO_TODAY };
};
const dateInRange = (date: string, start: string, end: string) => date >= start && date <= end;
const displayDate = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
const csvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

export function BusinessReport({ role }: { role: Role }) {
  const services = useOperations((state) => state.services);
  const staff = useOperations((state) => state.staff);
  const orders = useCommerce((state) => state.orders);
  const customers = useCommerce((state) => state.customers);
  const appointments = useAppointments((state) => state.appointments);
  const selectedStoreId = useMerchantScope((state) => state.selectedStoreId);
  const stores = useOperations((state) => state.stores);
  const isEmployee = role === "employee";
  const reportStoreId = role === "owner" ? selectedStoreId : DEMO_CONTEXT.defaultStoreId;
  const reportStore = stores.find((store) => store.id === reportStoreId);
  const availableStaff = staff.filter((member) => (!reportStoreId || member.storeId === reportStoreId) && member.status === "在职" && member.role === "员工");
  const [period, setPeriod] = useState<ReportPeriod>("本月");
  const [customStart, setCustomStart] = useState(monthStart(DEMO_TODAY));
  const [customEnd, setCustomEnd] = useState(DEMO_TODAY);
  const [filterOpen, setFilterOpen] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("全部");
  const [employeeFilter, setEmployeeFilter] = useState(isEmployee ? DEMO_CONTEXT.employeeId : "全部");
  const [metric, setMetric] = useState<ReportMetric | null>(null);
  const [exported, setExported] = useState(false);
  const range = reportRange(period, customStart, customEnd);
  const scopedOrders = orders.filter((order) => {
    const date = (order.completedAt ?? order.createdAt).slice(0, 10);
    return order.status === "已完成"
      && (!reportStoreId || order.storeId === reportStoreId)
      && dateInRange(date, range.start, range.end)
      && (paymentFilter === "全部" || order.paymentMethod === paymentFilter)
      && (employeeFilter === "全部" || order.employeeId === employeeFilter);
  });
  const completed = isEmployee ? scopedOrders.filter((order) => order.employeeId === DEMO_CONTEXT.employeeId) : scopedOrders;
  const revenueOrders = completed.filter((order) => order.paymentMethod !== "次卡");
  const revenue = revenueOrders.reduce((sum, order) => sum + order.payable, 0);
  const cashOrders = revenueOrders;
  const average = cashOrders.length ? Math.round(revenue / cashOrders.length) : 0;
  const activeCustomerIds = [...new Set(completed.map((order) => order.customerId))];
  const rangeAppointments = appointments.filter((appointment) => (!reportStoreId || appointment.storeId === reportStoreId) && dateInRange(appointment.date, range.start, range.end) && (employeeFilter === "全部" || appointment.employeeId === employeeFilter));
  const completionRate = rangeAppointments.length ? Math.round(rangeAppointments.filter((item) => item.status === "已完成").length / rangeAppointments.length * 100) : 0;
  const employeeRevenue = employees.filter((employee) => availableStaff.some((member) => member.id === employee.id)).map((employee) => ({ name: employee.name, value: revenueOrders.filter((order) => order.employeeId === employee.id).reduce((sum, order) => sum + order.payable, 0) })).sort((a, b) => b.value - a.value);
  const serviceRevenue = services.filter((service) => !reportStoreId || service.storeIds?.includes(reportStoreId)).map((service) => ({ name: service.name, value: revenueOrders.filter((order) => order.serviceId === service.id).reduce((sum, order) => sum + order.payable, 0), count: completed.filter((order) => order.serviceId === service.id).length })).sort((a, b) => b.value - a.value);
  const trendDates = Array.from({ length: 7 }, (_, index) => addDays(range.end, index - 6));
  const trend = trendDates.map((date) => revenueOrders.filter((order) => (order.completedAt ?? order.createdAt).startsWith(date)).reduce((sum, order) => sum + order.payable, 0));
  const maxEmployee = Math.max(...employeeRevenue.map((item) => item.value), 1);
  const filterCount = Number(paymentFilter !== "全部") + Number(employeeFilter !== "全部" && !isEmployee);
  const metricTitle = metric === "revenue" ? "实收营业额明细" : metric === "orders" ? "完成订单明细" : metric === "average" ? "平均客单明细" : "活跃会员明细";

  const changePeriod = (value: ReportPeriod) => {
    setPeriod(value);
    if (value === "自定义") setFilterOpen(true);
  };

  const exportReport = () => {
    const rows = [
      ["订单号", "完成时间", "会员", "服务项目", "服务员工", "门店", "支付方式", "实收金额"],
      ...completed.map((order) => [order.id, order.completedAt ?? order.createdAt, order.customer, order.service, order.employee, order.store, order.paymentMethod ?? "-", order.payable]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${reportStore?.name ?? "全部门店"}-${range.start}-${range.end}-经营报表.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setExported(true);
    window.setTimeout(() => setExported(false), 2200);
  };

  const metricOrders = metric === "average" || metric === "revenue" ? revenueOrders : completed;

  return <>
    <div className="page-heading"><div><span className="date-line">BUSINESS INTELLIGENCE</span><h1>{isEmployee ? "个人业绩" : role === "manager" ? "本店报表" : "经营报表"}</h1><p>{isEmployee ? "查看个人服务产值与项目表现。" : "从营收、顾客和团队维度了解门店经营。"}</p></div><button className="primary-action" onClick={exportReport}><Download size={17} /> {exported ? "已导出" : "导出报表"}</button></div>
    <section className="report-toolbar panel"><div className="report-period">{(["近 7 天", "本月", "上月", "自定义"] as ReportPeriod[]).map((item) => <button className={period === item ? "active" : ""} key={item} onClick={() => changePeriod(item)}>{item}</button>)}</div><div><button className="report-scope-button" title="店长报表仅展示所属门店"><Store size={15} /> {isEmployee ? DEMO_CONTEXT.employeeName : reportStore?.name ?? "全部门店"}</button><button className={filterCount ? "has-filter" : ""} onClick={() => setFilterOpen(true)}><Filter size={15} /> 筛选{filterCount ? ` · ${filterCount}` : ""}</button></div></section>
    <section className="report-metrics">
      <Metric label={isEmployee ? "个人产值" : "实收营业额"} value={currency(revenue)} detail={`${range.start.slice(5).replace("-", "/")} - ${range.end.slice(5).replace("-", "/")}`} icon={CircleDollarSign} tone="green" onClick={() => setMetric("revenue")} />
      <Metric label="完成订单" value={`${completed.length} 单`} detail={`服务完成率 ${completionRate}%`} icon={BadgeCheck} tone="blue" onClick={() => setMetric("orders")} />
      <Metric label="平均客单" value={currency(average)} detail={`${cashOrders.length} 笔现金类订单`} icon={TrendingUp} tone="gold" onClick={() => setMetric("average")} />
      <Metric label={isEmployee ? "服务顾客" : "活跃会员"} value={`${activeCustomerIds.length} 位`} detail="按完成订单去重" icon={Users} tone="coral" onClick={() => setMetric("customers")} />
    </section>
    <section className="report-main-grid">
      <article className="panel trend-panel"><div className="panel-head"><div><h2>营收趋势</h2><p>每日实际收款，不含次卡核销</p></div><div className="legend"><i /> 营业额</div></div><TrendChart values={trend} labels={trendDates.map((date) => date === DEMO_TODAY ? "今天" : displayDate(date))} /></article>
      <article className="panel health-panel"><div className="panel-head"><div><h2>经营健康度</h2><p>基于当前筛选数据</p></div></div><div className="health-score"><div><strong>{Math.round((completionRate + Math.min(100, activeCustomerIds.length * 18) + Math.min(100, average / 4)) / 3)}</strong><span>/100</span></div><p>{completed.length ? "经营状态正常" : "当前范围暂无成交"}</p></div><dl><div><dt>服务完成率</dt><dd>{completionRate}%</dd></div><div><dt>活跃会员</dt><dd>{activeCustomerIds.length} 位</dd></div><div><dt>现金类订单</dt><dd>{cashOrders.length} 单</dd></div></dl></article>
    </section>
    <section className="report-detail-grid">
      {!isEmployee && <article className="panel ranking-panel"><div className="panel-head"><div><h2>员工业绩</h2><p>按实际收款金额排序</p></div></div><div className="ranking-list">{employeeRevenue.map((item, index) => <div key={item.name}><span className="rank-number">{index + 1}</span><span className="rank-avatar">{item.name.slice(0, 1)}</span><div><strong>{item.name}</strong><span><i style={{ width: `${Math.max(5, item.value / maxEmployee * 100)}%` }} /></span></div><b>{currency(item.value)}</b></div>)}</div></article>}
      <article className="panel service-report"><div className="panel-head"><div><h2>项目表现</h2><p>服务项目营收与订单量</p></div></div><div className="service-report-head"><span>服务项目</span><span>订单量</span><span>实收金额</span></div>{serviceRevenue.map((item) => <div className="service-report-row" key={item.name}><strong>{item.name}</strong><span>{item.count} 单</span><b>{currency(item.value)}</b></div>)}</article>
      {isEmployee && <article className="panel personal-schedule"><div className="panel-head"><div><h2>服务状态</h2><p>本月个人预约分布</p></div></div>{["已完成", "服务中", "已确认", "待确认"].map((status) => { const count = appointments.filter((item) => item.employeeId === DEMO_CONTEXT.employeeId && item.status === status).length; return <div key={status}><span>{status}</span><strong>{count} 单</strong></div>; })}</article>}
    </section>
    {filterOpen && <><button className="commerce-scrim" aria-label="关闭报表筛选" onClick={() => setFilterOpen(false)} /><aside className="commerce-drawer report-filter-drawer"><div className="drawer-head"><div><span>REPORT FILTER</span><h2>报表筛选</h2><p>{reportStore?.name ?? "全部门店"} · {range.start} 至 {range.end}</p></div><button aria-label="关闭" onClick={() => setFilterOpen(false)}><X size={19} /></button></div>{period === "自定义" && <div className="report-date-range"><label><span>开始日期</span><input type="date" max={customEnd} value={customStart} onInput={(event) => setCustomStart(event.currentTarget.value)} /></label><label><span>结束日期</span><input type="date" min={customStart} max={DEMO_TODAY} value={customEnd} onInput={(event) => setCustomEnd(event.currentTarget.value)} /></label></div>}<section className="report-filter-section"><h3>支付方式</h3><div className="report-filter-options">{(["全部", "微信", "支付宝", "现金", "次卡"] as PaymentFilter[]).map((item) => <button className={paymentFilter === item ? "selected" : ""} key={item} onClick={() => setPaymentFilter(item)}>{item}{paymentFilter === item && <Check size={13} />}</button>)}</div></section>{!isEmployee && <section className="report-filter-section"><h3>服务员工</h3><div className="report-filter-options staff-options"><button className={employeeFilter === "全部" ? "selected" : ""} onClick={() => setEmployeeFilter("全部")}>全部员工{employeeFilter === "全部" && <Check size={13} />}</button>{availableStaff.map((member) => <button className={employeeFilter === member.id ? "selected" : ""} key={member.id} onClick={() => setEmployeeFilter(member.id)}>{member.name}<small>{member.title}</small>{employeeFilter === member.id && <Check size={13} />}</button>)}</div></section>}<div className="report-filter-actions"><button onClick={() => { setPaymentFilter("全部"); setEmployeeFilter(isEmployee ? DEMO_CONTEXT.employeeId : "全部"); }}>重置</button><button className="drawer-primary" onClick={() => setFilterOpen(false)}>查看筛选结果</button></div></aside></>}
    {metric && <><button className="commerce-scrim" aria-label="关闭指标明细" onClick={() => setMetric(null)} /><aside className="commerce-drawer report-detail-drawer"><div className="drawer-head"><div><span>METRIC DETAIL</span><h2>{metricTitle}</h2><p>{reportStore?.name ?? "全部门店"} · {range.start} 至 {range.end}</p></div><button aria-label="关闭" onClick={() => setMetric(null)}><X size={19} /></button></div>{metric === "customers" ? <div className="report-customer-detail">{activeCustomerIds.map((customerId) => { const customer = customers.find((item) => item.id === customerId); const customerOrders = completed.filter((order) => order.customerId === customerId); return <article key={customerId}><span>{customer?.name.slice(0, 1)}</span><div><strong>{customer?.name ?? customerId}</strong><small>{customerOrders.length} 单 · 最近到店 {customer?.lastVisit ?? "-"}</small></div><b>{currency(customerOrders.reduce((sum, order) => sum + order.payable, 0))}</b></article>; })}</div> : <div className="report-order-detail">{metricOrders.map((order: Order) => <article key={order.id}><div><strong>{order.service}</strong><small>{order.id} · {order.completedAt ?? order.createdAt}</small></div><span>{order.customer}<small>{order.employee} · {order.paymentMethod ?? "-"}</small></span><b>{currency(order.payable)}</b></article>)}</div>}{(metric === "customers" ? activeCustomerIds.length === 0 : metricOrders.length === 0) && <div className="report-empty"><BarChart3 size={28} /><strong>当前范围暂无数据</strong><span>可以调整日期或筛选条件后查看</span></div>}<div className="report-detail-total"><span>{metric === "customers" ? "活跃会员" : "合计"}</span><strong>{metric === "customers" ? `${activeCustomerIds.length} 位` : metric === "orders" ? `${completed.length} 单` : currency(metric === "average" ? average : revenue)}</strong></div></aside></>}
  </>;
}

function TenantBadge({ status }: { status: TenantStatus }) {
  return <span className={`platform-status platform-${status}`}>{status}</span>;
}

export function PlatformOverview({ onNavigate, onOpenTenant, onSelectTenant }: { onNavigate: (page: string) => void; onOpenTenant: () => void; onSelectTenant: (tenantId: string) => void }) {
  const tenants = usePlatform((state) => state.tenants);
  const logs = usePlatform((state) => state.logs);
  const active = tenants.filter((tenant) => tenant.status !== "已冻结");
  const stores = active.reduce((sum, tenant) => sum + tenant.stores, 0);
  const appointments = active.reduce((sum, tenant) => sum + tenant.monthlyAppointments, 0);

  return <>
    <div className="page-heading"><div><span className="date-line">PLATFORM OPERATIONS</span><h1>平台总览</h1><p>追踪商家增长、活跃和服务健康度。</p></div><button className="primary-action" onClick={onOpenTenant}><Building2 size={17} /> 开通商家</button></div>
    <section className="stat-grid"><Metric label="入驻商家" value={`${tenants.length} 家`} detail="本月新增 2 家" icon={Building2} tone="green" onClick={() => onNavigate("商家管理")} /><Metric label="活跃门店" value={`${stores} 家`} detail="平台活跃率 92.6%" icon={Store} tone="blue" onClick={() => onNavigate("商家管理")} /><Metric label="本月预约" value={appointments.toLocaleString()} detail="较上月 +18.2%" icon={CalendarDays} tone="gold" onClick={() => onNavigate("平台日志")} /><Metric label="待续费商家" value={`${tenants.filter((tenant) => ["即将到期", "试用中"].includes(tenant.status)).length} 家`} detail="未来 30 天" icon={Clock3} tone="coral" onClick={() => onNavigate("商家管理")} /></section>
    <section className="platform-overview-grid"><button className="panel platform-growth platform-overview-action" onClick={() => onNavigate("商家管理")} aria-label="查看商家增长明细"><div className="panel-head"><div><h2>商家增长趋势</h2><p>近 7 个月累计付费商家</p></div><span className="trend">+16.4%</span></div><TrendChart values={[1, 2, 2, 3, 4, 5, tenants.length]} formatValue={(value) => `${value} 家`} /></button><button className="panel plan-distribution platform-overview-action" onClick={() => onNavigate("套餐管理")} aria-label="查看套餐分布明细"><div className="panel-head"><div><h2>套餐分布</h2><p>当前商家版本构成</p></div></div><div className="donut"><div><strong>{tenants.length}</strong><span>商家</span></div></div><div className="plan-legend"><span><i className="plan-basic" />基础版 <b>{tenants.filter((item) => item.planId === "P001").length}</b></span><span><i className="plan-pro" />专业版 <b>{tenants.filter((item) => item.planId === "P002").length}</b></span><span><i className="plan-chain" />连锁版 <b>{tenants.filter((item) => item.planId === "P003").length}</b></span></div></button></section>
    <section className="platform-bottom-grid"><article className="panel"><div className="panel-head"><div><h2>重点商家</h2><p>活跃与续费状态</p></div><button className="text-button" onClick={() => onNavigate("商家管理")}>全部商家 <ArrowRight size={15} /></button></div><div className="platform-tenant-row platform-tenant-head"><span>商家</span><span>门店</span><span>本月预约</span><span>状态</span></div>{tenants.slice(0, 5).map((tenant) => <button className="platform-tenant-row platform-tenant-action" key={tenant.id} onClick={() => onSelectTenant(tenant.id)}><span><strong>{tenant.name}</strong><small>{tenant.owner} · {tenant.lastActiveAt}</small></span><span>{tenant.stores}</span><span>{tenant.monthlyAppointments.toLocaleString()}</span><TenantBadge status={tenant.status} /></button>)}</article><article className="panel recent-logs"><div className="panel-head"><div><h2>最近操作</h2><p>平台重要事件</p></div><button className="text-button" onClick={() => onNavigate("平台日志")}>全部日志 <ArrowRight size={15} /></button></div>{logs.slice(0, 5).map((log) => <button key={log.id} onClick={() => onNavigate("平台日志")}><span className={log.risk === "重要" ? "important" : ""}><FileClock size={15} /></span><span><strong>{log.action} · {log.target}</strong><small>{log.createdAt}</small></span></button>)}</article></section>
  </>;
}

export function TenantManagement({ composerOpen, onComposerOpen, onComposerClose, selectedId, onSelectTenant }: { composerOpen: boolean; onComposerOpen: () => void; onComposerClose: () => void; selectedId: string | null; onSelectTenant: (tenantId: string | null) => void }) {
  const tenants = usePlatform((state) => state.tenants);
  const plans = usePlatform((state) => state.plans);
  const updateStatus = usePlatform((state) => state.updateTenantStatus);
  const renewTenant = usePlatform((state) => state.renewTenant);
  const changeTenantPlan = usePlatform((state) => state.changeTenantPlan);
  const addTenant = usePlatform((state) => state.addTenant);
  const removeTenant = usePlatform((state) => state.removeTenant);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TenantStatus | "全部">("全部");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [tenantName, setTenantName] = useState("");
  const [owner, setOwner] = useState("");
  const [phone, setPhone] = useState("");
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const selected = tenants.find((tenant) => tenant.id === selectedId) ?? null;
  const filtered = tenants.filter((tenant) => `${tenant.name}${tenant.owner}${tenant.phone}`.includes(query) && (filter === "全部" || tenant.status === filter));
  const submitTenant = () => {
    if (!tenantName.trim() || !owner.trim() || !phone.trim() || !planId) return;
    addTenant({ id: `T${Date.now()}`, name: tenantName.trim(), owner: owner.trim(), phone: phone.trim(), stores: 1, employees: 1, members: 0, monthlyAppointments: 0, planId, status: "试用中", expiresAt: addDays(DEMO_TODAY, 14), createdAt: DEMO_TODAY, lastActiveAt: `${DEMO_TODAY} 09:00` });
    setTenantName(""); setOwner(""); setPhone(""); setPlanId(plans[0]?.id ?? ""); onComposerClose();
  };

  return <>
    <div className="page-heading"><div><span className="date-line">TENANT MANAGEMENT</span><h1>商家管理</h1><p>管理商家开通、套餐、续期与服务状态。</p></div><button className="primary-action" onClick={onComposerOpen}><Building2 size={17} /> 开通商家</button></div>
    <article className="panel tenant-management"><div className="tenant-toolbar"><div className="inline-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索商家、负责人或手机号" /></div><div className="status-filter">{(["全部", "正常", "试用中", "即将到期", "已冻结"] as const).map((status) => <button className={filter === status ? "active" : ""} key={status} onClick={() => setFilter(status)}>{status}</button>)}</div></div><div className="tenant-manage-row tenant-manage-head"><span>商家信息</span><span>套餐版本</span><span>规模</span><span>本月预约</span><span>到期时间</span><span>状态</span><span /></div>{filtered.map((tenant) => { const plan = plans.find((item) => item.id === tenant.planId); return <div className="tenant-manage-row" key={tenant.id}><span><i>{tenant.name.slice(0, 1)}</i><span><strong>{tenant.name}</strong><small>{tenant.owner} · {tenant.phone}</small></span></span><span>{plan?.name}</span><span>{tenant.stores} 店 / {tenant.employees} 人</span><strong>{tenant.monthlyAppointments.toLocaleString()}</strong><span>{tenant.expiresAt}</span><TenantBadge status={tenant.status} /><button onClick={() => { setDeleteConfirm(false); onSelectTenant(tenant.id); }}>管理</button></div>; })}</article>
    {selected && <><div className="commerce-scrim" onClick={() => { setDeleteConfirm(false); onSelectTenant(null); }} /><aside className="commerce-drawer tenant-drawer"><div className="drawer-head"><div><span>TENANT {selected.id}</span><h2>商家服务管理</h2></div><button onClick={() => { setDeleteConfirm(false); onSelectTenant(null); }}><X size={19} /></button></div><div className="tenant-drawer-head"><span>{selected.name.slice(0, 1)}</span><div><h3>{selected.name}</h3><p>{selected.owner} · {selected.phone}</p></div><TenantBadge status={selected.status} /></div><div className="tenant-usage"><div><strong>{selected.stores}</strong><span>门店</span></div><div><strong>{selected.employees}</strong><span>员工</span></div><div><strong>{selected.members}</strong><span>会员</span></div></div><div className="drawer-form"><label><span>当前套餐</span><select value={selected.planId} onChange={(event) => changeTenantPlan(selected.id, event.target.value)}>{plans.map((plan) => <option value={plan.id} key={plan.id}>{plan.name} · {currency(plan.price)}/年</option>)}</select></label><label><span>服务到期时间</span><input value={selected.expiresAt} disabled /></label></div><div className="renew-options"><span>快速续期</span><div><button onClick={() => renewTenant(selected.id, 3)}>3 个月</button><button onClick={() => renewTenant(selected.id, 6)}>6 个月</button><button onClick={() => renewTenant(selected.id, 12)}>12 个月</button></div></div><button className={`tenant-state-action ${selected.status === "已冻结" ? "enable" : "freeze"}`} onClick={() => updateStatus(selected.id, selected.status === "已冻结" ? "正常" : "已冻结")}>{selected.status === "已冻结" ? <><RefreshCw size={16} />恢复商家服务</> : <><ShieldCheck size={16} />冻结商家服务</>}</button><button className={`tenant-delete-action ${deleteConfirm ? "confirm" : ""}`} onClick={() => { if (!deleteConfirm) { setDeleteConfirm(true); return; } removeTenant(selected.id); setDeleteConfirm(false); onSelectTenant(null); }}><X size={15} />{deleteConfirm ? "再次点击确认删除" : "删除商家"}</button></aside></>}
    {composerOpen && <><button className="commerce-scrim" aria-label="关闭开通商家" onClick={onComposerClose} /><aside className="commerce-drawer tenant-create-drawer"><div className="drawer-head"><div><span>NEW TENANT</span><h2>开通商家</h2><p>创建商家账号并开通 14 天试用。</p></div><button aria-label="关闭" onClick={onComposerClose}><X size={19} /></button></div><div className="drawer-form"><label><span>商家名称</span><input value={tenantName} onChange={(event) => setTenantName(event.target.value)} placeholder="例如：清颜美肤中心" /></label><label><span>负责人</span><input value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="请输入负责人姓名" /></label><label><span>联系电话</span><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="请输入手机号" /></label><label><span>开通套餐</span><select value={planId} onChange={(event) => setPlanId(event.target.value)}>{plans.map((plan) => <option value={plan.id} key={plan.id}>{plan.name} · {currency(plan.price)}/年</option>)}</select></label></div><div className="tenant-create-summary"><span>初始配置</span><strong>1 家门店 · 1 个员工账号 · 14 天试用</strong></div><button className="drawer-primary" disabled={!tenantName.trim() || !owner.trim() || !phone.trim() || !planId} onClick={submitTenant}><Check size={16} />确认开通商家</button></aside></>}
  </>;
}

export function PlanManagement() {
  const plans = usePlatform((state) => state.plans);
  const tenants = usePlatform((state) => state.tenants);
  const savePlan = usePlatform((state) => state.savePlan);
  const removePlan = usePlatform((state) => state.removePlan);
  const [draft, setDraft] = useState<SaaSPlan | null>(null);
  const [featuresText, setFeaturesText] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const openEditor = (plan?: SaaSPlan) => {
    const next = plan ? { ...plan, features: [...plan.features] } : { id: `P${Date.now()}`, name: "", price: 0, storeLimit: 1, employeeLimit: 10, features: [], tenantCount: 0, active: true };
    setDraft(next);
    setFeaturesText(next.features.join("、"));
    setDeleteConfirm(false);
  };
  const features = featuresText.split(/[、,，\n]/).map((item) => item.trim()).filter(Boolean);
  const canSave = Boolean(draft?.name.trim() && draft.price > 0 && draft.storeLimit > 0 && draft.employeeLimit > 0 && features.length);
  const submitPlan = () => {
    if (!draft || !canSave) return;
    savePlan({ ...draft, name: draft.name.trim(), features });
    setDraft(null);
  };
  const assignedTenants = draft ? tenants.filter((tenant) => tenant.planId === draft.id).length : 0;
  return <>
    <div className="page-heading"><div><span className="date-line">SUBSCRIPTION PLANS</span><h1>套餐管理</h1><p>配置不同商家规模对应的产品能力。</p></div><button className="primary-action" onClick={() => openEditor()}><PackageCheck size={17} /> 新建套餐</button></div>
    <section className="plan-card-grid">{plans.map((plan, index) => <article className={`plan-card plan-card-${index + 1}`} key={plan.id}><div className="plan-card-head"><span>{index === 1 ? "推荐套餐" : "年度订阅"}</span><i>{plan.name}</i></div><h2>{currency(plan.price)}<small>/年</small></h2><p>适合 {plan.storeLimit === 1 ? "单店经营" : plan.storeLimit <= 5 ? "成长型多门店" : "连锁品牌总部"}</p><dl><div><dt>门店上限</dt><dd>{plan.storeLimit} 家</dd></div><div><dt>员工上限</dt><dd>{plan.employeeLimit} 人</dd></div><div><dt>当前商家</dt><dd>{tenants.filter((tenant) => tenant.planId === plan.id).length} 家</dd></div></dl><ul>{plan.features.map((feature) => <li key={feature}><Check size={14} />{feature}</li>)}</ul><button onClick={() => openEditor(plan)}>编辑套餐 <ArrowRight size={15} /></button></article>)}</section>
    <article className="panel plan-comparison"><div className="panel-head"><div><h2>套餐使用概览</h2><p>订阅商家与预计年收入</p></div></div><div className="plan-comparison-head"><span>套餐</span><span>使用商家</span><span>占比</span><span>预计年收入</span><span>状态</span></div>{plans.map((plan) => { const count = tenants.filter((tenant) => tenant.planId === plan.id).length; return <div className="plan-comparison-row" key={plan.id}><strong>{plan.name}</strong><span>{count} 家</span><span>{Math.round(count / tenants.length * 100)}%</span><b>{currency(plan.price * count)}</b><i>{plan.active ? "已启用" : "已停用"}</i></div>; })}</article>
    {draft && <><button className="commerce-scrim" aria-label="关闭套餐编辑" onClick={() => setDraft(null)} /><aside className="commerce-drawer plan-editor-drawer"><div className="drawer-head"><div><span>{plans.some((plan) => plan.id === draft.id) ? `PLAN ${draft.id}` : "NEW PLAN"}</span><h2>{plans.some((plan) => plan.id === draft.id) ? "编辑套餐" : "新建套餐"}</h2><p>保存后将同步更新套餐卡片和商家开通选项。</p></div><button aria-label="关闭" onClick={() => setDraft(null)}><X size={19} /></button></div><div className="drawer-form"><label><span>套餐名称</span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="例如：旗舰版" /></label><div className="plan-form-grid"><label><span>年费（元）</span><input type="number" min="1" value={draft.price || ""} onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })} placeholder="请输入年费" /></label><label><span>门店上限</span><input type="number" min="1" value={draft.storeLimit} onChange={(event) => setDraft({ ...draft, storeLimit: Number(event.target.value) })} /></label></div><label><span>员工上限</span><input type="number" min="1" value={draft.employeeLimit} onChange={(event) => setDraft({ ...draft, employeeLimit: Number(event.target.value) })} /></label><label><span>套餐功能</span><textarea value={featuresText} onChange={(event) => setFeaturesText(event.target.value)} placeholder="使用顿号或换行分隔，例如：预约管理、会员管理、数据导出" /></label><label className="plan-active-toggle"><span><strong>启用套餐</strong><small>停用后保留已有商家数据，但不再推荐开通</small></span><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} /></label></div><div className="plan-feature-preview"><span>功能预览</span><div>{features.length ? features.map((feature) => <i key={feature}><Check size={12} />{feature}</i>) : <small>至少配置一项套餐功能</small>}</div></div><button className="drawer-primary" disabled={!canSave} onClick={submitPlan}><Check size={16} />保存套餐</button>{plans.some((plan) => plan.id === draft.id) && <button className={`plan-delete-action ${deleteConfirm ? "confirm" : ""}`} disabled={assignedTenants > 0} title={assignedTenants ? `已有 ${assignedTenants} 家商家使用，无法删除` : ""} onClick={() => { if (!deleteConfirm) { setDeleteConfirm(true); return; } removePlan(draft.id); setDraft(null); }}><X size={15} />{assignedTenants ? `${assignedTenants} 家商家使用中，无法删除` : deleteConfirm ? "再次点击确认删除" : "删除套餐"}</button>}</aside></>}
  </>;
}

export function PlatformLogs() {
  const logs = usePlatform((state) => state.logs);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("全部类型");
  const [filterOpen, setFilterOpen] = useState(false);
  const [exported, setExported] = useState(false);
  const actionTypes = ["全部类型", ...Array.from(new Set(logs.map((log) => log.action)))];
  const filtered = logs.filter((log) => `${log.action}${log.target}${log.operator}${log.detail}`.includes(query) && (type === "全部类型" || log.action === type));
  const exportLogs = () => {
    const rows = [
      ["时间", "操作人员", "操作类型", "目标对象", "操作详情", "级别"],
      ...filtered.map((log) => [log.createdAt, log.operator, log.action, log.target, log.detail, log.risk]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `平台操作日志-${DEMO_TODAY}.csv`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExported(true);
    window.setTimeout(() => setExported(false), 2200);
  };
  return <>
    <div className="page-heading"><div><span className="date-line">AUDIT TRAIL</span><h1>平台日志</h1><p>记录商家状态、套餐和平台关键操作。</p></div><button className="primary-action" onClick={exportLogs}><Download size={17} /> {exported ? "已导出" : "导出日志"}</button></div>
    <article className="panel audit-panel"><div className="audit-toolbar"><div className="inline-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索操作、商家或人员" /></div><div className="audit-filter"><button className={type !== "全部类型" ? "active" : ""} aria-haspopup="listbox" aria-expanded={filterOpen} onClick={() => setFilterOpen((open) => !open)}><Filter size={15} />{type}<ChevronDown size={13} /></button>{filterOpen && <><button className="audit-filter-scrim" aria-label="关闭类型筛选" onClick={() => setFilterOpen(false)} /><div className="audit-filter-menu" role="listbox" aria-label="日志操作类型">{actionTypes.map((action) => <button className={type === action ? "selected" : ""} key={action} onClick={() => { setType(action); setFilterOpen(false); }}><span>{action}</span>{type === action && <Check size={14} />}</button>)}</div></>}</div></div><div className="audit-row audit-head"><span>时间</span><span>操作人员</span><span>操作类型</span><span>目标对象</span><span>操作详情</span><span>级别</span></div>{filtered.map((log) => <div className="audit-row" key={log.id}><span>{log.createdAt}</span><span><i><UserRound size={14} /></i>{log.operator}</span><strong>{log.action}</strong><span>{log.target}</span><span>{log.detail}</span><b className={log.risk === "重要" ? "risk-important" : ""}>{log.risk}</b></div>)}{filtered.length === 0 && <div className="audit-empty"><FileClock size={26} /><strong>没有匹配的操作日志</strong><span>可以调整搜索内容或操作类型</span></div>}</article>
  </>;
}

export function SystemAnnouncements() {
  const [items, setItems] = useState([
    { id: "N001", title: "8 月产品功能更新说明", scope: "全部商家", date: "2026-08-12", status: "已发布" },
    { id: "N002", title: "平台服务升级维护通知", scope: "全部商家", date: "2026-08-08", status: "已发布" },
    { id: "N003", title: "七夕营销活动素材上线", scope: "专业版商家", date: "2026-08-06", status: "草稿" },
  ]);
  const [composer, setComposer] = useState(false);
  const [title, setTitle] = useState("");
  const publish = () => {
    if (!title.trim()) return;
    setItems([{ id: `N${Date.now()}`, title: title.trim(), scope: "全部商家", date: DEMO_TODAY, status: "已发布" }, ...items]);
    setTitle("");
    setComposer(false);
  };
  return <>
    <div className="page-heading"><div><span className="date-line">SYSTEM MESSAGES</span><h1>系统公告</h1><p>向平台商家发布产品、运营和维护信息。</p></div><button className="primary-action" onClick={() => setComposer(true)}><Plus size={17} /> 发布公告</button></div>
    <article className="panel notice-panel"><div className="notice-row notice-head"><span>公告标题</span><span>发布范围</span><span>发布日期</span><span>状态</span><span /></div>{items.map((item) => <div className="notice-row" key={item.id}><span><i><Bell size={15} /></i><strong>{item.title}</strong></span><span>{item.scope}</span><span>{item.date}</span><b className={item.status === "已发布" ? "published" : "draft"}>{item.status}</b><button>查看</button></div>)}</article>
    {composer && <><div className="commerce-scrim" onClick={() => setComposer(false)} /><aside className="commerce-drawer"><div className="drawer-head"><div><span>NEW ANNOUNCEMENT</span><h2>发布系统公告</h2></div><button onClick={() => setComposer(false)}><X size={19} /></button></div><div className="drawer-form"><label><span>公告标题</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="请输入公告标题" /></label><label><span>发布范围</span><select><option>全部商家</option><option>基础版商家</option><option>专业版商家</option><option>连锁版商家</option></select></label><label><span>公告内容</span><textarea placeholder="请输入公告内容" /></label></div><button className="drawer-primary notice-publish" disabled={!title.trim()} onClick={publish}>发布公告 <ArrowRight size={16} /></button></aside></>}
  </>;
}
