import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  CircleDollarSign,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  ClipboardList,
  Clock3,
  CreditCard,
  HeartHandshake,
  Eye,
  EyeOff,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  PackageCheck,
  Phone,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  Megaphone,
  QrCode,
  RotateCcw,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { demoUsers, roleLabels } from "./data";
import { AppointmentCenter, CustomerBooking } from "./appointment-views";
import { AiAdvisor } from "./ai-advisor";
import { CustomerMarketplace } from "./customer-marketplace";
import { CardCenter, CustomerAssets, CustomerCenter, CustomerNotifications, CustomerProfile, OrderCenter } from "./commerce-views";
import { BusinessReport, PlanManagement, PlatformLogs, PlatformOverview, SystemAnnouncements, TenantManagement } from "./report-platform-views";
import { DemoSettings, StaffManagement, StoreManagement } from "./operations-views";
import { MarketingManagement, PrivateStoreCenter, ServiceManagement } from "./merchant-management-views";
import { AfterSaleCenter, CustomerAfterSales } from "./after-sale-views";
import { useAppointments, useCommerce, useCustomerContext, useMerchantScope, useOperations, useSession } from "./store";
import { DEMO_CONTEXT, DEMO_TODAY } from "./demo-context";
import { getTodayVisitEntries } from "./dashboard-metrics";
import type { Appointment, AppointmentStatus, BookingOffer, DemoUser, MarketplaceStore, Role } from "./types";

type IconType = typeof LayoutDashboard;

const menus: Record<Role, Array<{ label: string; icon: IconType }>> = {
  owner: [
    { label: "经营工作台", icon: LayoutDashboard },
    { label: "预约日历", icon: CalendarDays },
    { label: "订单管理", icon: ClipboardList },
    { label: "售后管理", icon: RotateCcw },
    { label: "会员管理", icon: Users },
    { label: "服务与次卡", icon: WalletCards },
    { label: "营销活动", icon: Megaphone },
    { label: "员工管理", icon: CircleUserRound },
    { label: "门店管理", icon: Store },
    { label: "私域店铺", icon: QrCode },
    { label: "经营报表", icon: BarChart3 },
  ],
  manager: [
    { label: "门店工作台", icon: LayoutDashboard },
    { label: "预约日历", icon: CalendarDays },
    { label: "开单收银", icon: CircleDollarSign },
    { label: "售后管理", icon: RotateCcw },
    { label: "会员管理", icon: Users },
    { label: "员工排班", icon: Clock3 },
    { label: "本店报表", icon: BarChart3 },
  ],
  receptionist: [
    { label: "前台工作台", icon: LayoutDashboard },
    { label: "预约接待", icon: CalendarDays },
    { label: "收银核销", icon: CircleDollarSign },
    { label: "售后处理", icon: RotateCcw },
    { label: "会员查询", icon: Users },
  ],
  employee: [
    { label: "今日工作", icon: LayoutDashboard },
    { label: "我的日程", icon: CalendarDays },
    { label: "我的顾客", icon: HeartHandshake },
    { label: "个人业绩", icon: BarChart3 },
  ],
  customer: [
    { label: "首页", icon: Store },
    { label: "预约", icon: CalendarDays },
    { label: "权益", icon: CreditCard },
    { label: "我的", icon: CircleUserRound },
  ],
  platform: [
    { label: "平台看板", icon: LayoutDashboard },
    { label: "商家管理", icon: Building2 },
    { label: "套餐管理", icon: PackageCheck },
    { label: "系统公告", icon: Bell },
    { label: "平台日志", icon: ShieldCheck },
    { label: "平台设置", icon: Settings },
  ],
};

function Brand({ compact = false, onClick }: { compact?: boolean; onClick?: () => void }) {
  const content = <>
      <span className="brand-mark"><Sparkles size={18} /></span>
      {!compact && <span>栖光美业</span>}
    </>;
  return onClick
    ? <button className="brand brand-button" onClick={onClick} aria-label="返回工作台">{content}</button>
    : <div className="brand">{content}</div>;
}

function Login() {
  const setRole = useSession((state) => state.setRole);
  const [, setSearchParams] = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const fillAccount = (user: DemoUser) => {
    setUsername(user.username);
    setPassword(user.password);
    setError("");
  };

  const login = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const account = demoUsers.find((user) => user.username === username.trim().toLowerCase() && user.password === password);
    if (!account) {
      setError("账号或密码不正确，请检查后重试。");
      return;
    }
    setRole(account.role);
    setSearchParams({ role: account.role, page: menus[account.role][0].label });
  };

  return (
    <main className="login-shell">
      <section className="login-context">
        <Brand />
        <div className="context-copy">
          <span className="eyebrow">BEAUTY BUSINESS OS</span>
          <h1>把每一次服务，<br />变成持续经营。</h1>
          <p>预约、会员、交易和团队协作汇聚在一个工作台，让门店每天都清楚下一步。</p>
        </div>
        <div className="context-proof">
          <div><strong>2</strong><span>家演示门店</span></div>
          <div><strong>486</strong><span>位活跃会员</span></div>
          <div><strong>92%</strong><span>预约到店率</span></div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-heading">
            <span className="mobile-brand"><Brand /></span>
            <span className="step-label">演示环境</span>
            <h2>登录栖光美业</h2>
            <p>使用分配的账号进入对应工作空间。</p>
          </div>

          <form className="login-form" onSubmit={login}>
            <label><span>登录账号</span><div className="login-input"><CircleUserRound size={18} /><input value={username} autoComplete="username" onChange={(event) => { setUsername(event.target.value); setError(""); }} placeholder="请输入账号" /></div></label>
            <label><span>登录密码</span><div className="login-input"><LockKeyhole size={18} /><input value={password} type={showPassword ? "text" : "password"} autoComplete="current-password" onChange={(event) => { setPassword(event.target.value); setError(""); }} placeholder="请输入密码" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "隐藏密码" : "显示密码"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
            {error && <p className="login-error">{error}</p>}
            <button className="primary-button" type="submit">登录 <ArrowRight size={17} /></button>
          </form>

          <section className="demo-accounts">
            <div><strong>体验不同角色</strong><span>密码均为 demo123</span></div>
            <div className="demo-account-grid">{demoUsers.map((user) => <button type="button" className={username === user.username ? "selected" : ""} key={user.role} onClick={() => fillAccount(user)}><span className={`avatar avatar-${user.role}`}>{user.name.slice(0, 1)}</span><span><strong>{user.title}</strong><small>{user.username}</small></span><Check size={15} /></button>)}</div>
          </section>
          <p className="login-note"><LockKeyhole size={12} />本地演示数据，不会提交个人信息</p>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value, change, icon: Icon, accent, onClick }: { label: string; value: string; change: string; icon: IconType; accent: string; onClick?: () => void }) {
  const content = <>
      <div className="stat-head"><span>{label}</span><i style={{ background: accent }}><Icon size={18} /></i></div>
      <strong>{value}</strong>
      <small>{change}</small>
    </>;
  return onClick
    ? <button className="stat-card stat-card-action" onClick={onClick} aria-label={`${label}，查看详情`}>{content}</button>
    : <article className="stat-card">{content}</article>;
}

function Status({ value }: { value: Appointment["status"] }) {
  return <span className={`status status-${value}`}>{value}</span>;
}

const dashboardAppointmentTransitions: Partial<Record<AppointmentStatus, AppointmentStatus[]>> = {
  待确认: ["已确认", "已取消"],
  已确认: ["已到店", "未到店", "已取消"],
  已到店: ["服务中"],
  服务中: ["已完成"],
};

const dashboardAppointmentActions: Partial<Record<AppointmentStatus, string>> = {
  已确认: "确认预约",
  已到店: "登记到店",
  未到店: "标记未到店",
  服务中: "开始服务",
  已完成: "完成服务",
  已取消: "取消预约",
};

function formatAppointmentDate(value: string) {
  const [, month, day] = value.split("-");
  return `${Number(month)}月${Number(day)}日`;
}

function RevenueChart() {
  const values = [42, 55, 48, 67, 61, 79, 74];
  return (
    <div className="chart-wrap">
      <div className="chart-bars">
        {values.map((value, index) => (
          <div className="bar-column" key={index}>
            <span className="bar" style={{ height: `${value}%` }} />
            <small>{["一", "二", "三", "四", "五", "六", "日"][index]}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function MerchantDashboard({ role, onNavigate }: { role: Role; onNavigate: (page: string) => void }) {
  const allAppointments = useAppointments((state) => state.appointments);
  const updateAppointmentStatus = useAppointments((state) => state.updateStatus);
  const orders = useCommerce((state) => state.orders);
  const customers = useCommerce((state) => state.customers);
  const createOrderFromAppointment = useCommerce((state) => state.createOrderFromAppointment);
  const stores = useOperations((state) => state.stores);
  const selectedStoreId = useMerchantScope((state) => state.selectedStoreId);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [visitDrawerOpen, setVisitDrawerOpen] = useState(false);
  const isEmployee = role === "employee";
  const isReceptionist = role === "receptionist";
  const scopedStoreId = isEmployee || role === "manager" || isReceptionist ? DEMO_CONTEXT.defaultStoreId : selectedStoreId;
  const scopedStore = stores.find((store) => store.id === scopedStoreId);
  const scopeName = scopedStore?.name ?? "全部门店";
  const title = isEmployee ? `早上好，${DEMO_CONTEXT.employeeName}` : isReceptionist ? "前台接待台" : role === "manager" ? "今日门店运营" : "经营概览";
  const todayAppointments = allAppointments.filter((item) => item.date === DEMO_TODAY && (!scopedStoreId || item.storeId === scopedStoreId) && (!isEmployee || item.employeeId === DEMO_CONTEXT.employeeId));
  const pendingCount = todayAppointments.filter((item) => item.status === "待确认").length;
  const completedOrders = orders.filter((order) => order.status === "已完成" && (!scopedStoreId || order.storeId === scopedStoreId));
  const revenue = completedOrders.reduce((sum, order) => sum + order.payable, 0);
  const appointmentPage = isEmployee ? "我的日程" : isReceptionist ? "预约接待" : "预约日历";
  const orderPage = role === "owner" ? "订单管理" : role === "manager" ? "开单收银" : isReceptionist ? "收银核销" : "个人业绩";
  const customerPage = isEmployee ? "我的顾客" : isReceptionist ? "会员查询" : "会员管理";
  const cardPage = role === "owner" ? "服务与次卡" : isReceptionist ? "收银核销" : customerPage;
  const selectedAppointment = todayAppointments.find((item) => item.id === selectedAppointmentId) ?? null;
  const selectedCustomer = customers.find((item) => item.id === selectedAppointment?.customerId);
  const selectedOrder = orders.find((item) => item.appointmentId === selectedAppointmentId);
  const visitEntries = getTodayVisitEntries(allAppointments, orders, customers, DEMO_TODAY, scopedStoreId);
  const newVisitCount = visitEntries.filter((entry) => entry.isNew).length;
  const appointmentVisitCount = visitEntries.filter((entry) => entry.source === "预约到店").length;
  const walkInVisitCount = visitEntries.filter((entry) => entry.source === "现场开单").length;
  const availableTransitions = selectedAppointment
    ? (dashboardAppointmentTransitions[selectedAppointment.status] ?? []).filter((status) => !isReceptionist || ["已确认", "已到店", "未到店", "已取消"].includes(status))
    : [];
  const advanceAppointment = (status: AppointmentStatus) => {
    if (!selectedAppointment) return;
    const updated = updateAppointmentStatus(selectedAppointment.id, status);
    if (updated && status === "已完成") createOrderFromAppointment(updated);
  };
  return (
    <>
      <div className="page-heading">
        <div><span className="date-line">8月13日 · 星期四</span><h1>{title}</h1><p>{isEmployee ? "今天有 4 位顾客等待你的专业服务。" : isReceptionist ? `${scopeName}今日接待、预约与核销集中在这里处理。` : `${scopeName}今日预约平稳，下午时段较繁忙。`}</p></div>
        <button className="primary-action" onClick={() => onNavigate(appointmentPage)}><CalendarDays size={17} /> {isReceptionist ? "代客预约" : "新建预约"}</button>
      </div>
      <section className="stat-grid">
        <StatCard label={isEmployee ? "今日服务" : "已完成实收"} value={isEmployee ? `${todayAppointments.length} 单` : `¥ ${revenue.toLocaleString("zh-CN")}`} change={isEmployee ? `已完成 ${todayAppointments.filter((item) => item.status === "已完成").length} 单` : `${scopeName}当前数据`} icon={CircleDollarSign} accent="#dff2e8" onClick={() => onNavigate(orderPage)} />
        <StatCard label="今日预约" value={String(todayAppointments.length)} change={`待确认 ${pendingCount} 单`} icon={CalendarDays} accent="#e7eefb" onClick={() => onNavigate(appointmentPage)} />
        <StatCard label={isEmployee ? "本月业绩" : "今日到店"} value={isEmployee ? "¥ 18,920" : `${visitEntries.length} 位`} change={isEmployee ? "门店排名第 2" : `预约 ${appointmentVisitCount} · 临客 ${walkInVisitCount} · 新客 ${newVisitCount}`} icon={Users} accent="#f7ead9" onClick={isEmployee ? () => onNavigate(customerPage) : () => setVisitDrawerOpen(true)} />
        <StatCard label="次卡核销" value="9 次" change="预计金额 ¥2,460" icon={WalletCards} accent="#f3e4e2" onClick={() => onNavigate(cardPage)} />
      </section>
      <section className="dashboard-grid">
        <article className="panel schedule-panel">
            <div className="panel-head"><div><h2>今日预约</h2><p>共 {todayAppointments.length} 项安排</p></div><button className="text-button" onClick={() => onNavigate(appointmentPage)}>查看日历 <ArrowRight size={15} /></button></div>
          <div className="appointment-list">
            {todayAppointments.map((item) => (
              <div className="appointment-row" key={item.id}>
                <time>{item.time}</time>
                <span className="timeline-dot" />
                <div className="appointment-main"><strong>{item.customer}</strong><span>{item.service} · {item.employee}</span></div>
                <Status value={item.status} />
                <button className="row-action" onClick={() => setSelectedAppointmentId(item.id)} aria-label={`查看${item.customer}的预约详情`}>详情</button>
              </div>
            ))}
          </div>
        </article>
        <aside className="right-stack">
          <article className="panel revenue-panel">
            <div className="panel-head"><div><h2>近 7 日营收</h2><p>¥ 42,860</p></div><span className="trend">+8.2%</span></div>
            <RevenueChart />
          </article>
          <article className="panel attention-panel">
            <div className="panel-head"><div><h2>待处理</h2><p>需要你关注的事项</p></div></div>
            <button onClick={() => onNavigate(appointmentPage)}><span className="attention-icon warm"><CalendarDays size={17} /></span><span><strong>{pendingCount} 个预约待确认</strong><small>请及时联系顾客确认</small></span><ArrowRight size={16} /></button>
            <button onClick={() => onNavigate(cardPage)}><span className="attention-icon blue"><CreditCard size={17} /></span><span><strong>5 张次卡即将到期</strong><small>未来 7 天内到期</small></span><ArrowRight size={16} /></button>
          </article>
        </aside>
      </section>
      {selectedAppointment && <>
        <button className="commerce-scrim" aria-label="关闭预约详情" onClick={() => setSelectedAppointmentId(null)} />
        <aside className="commerce-drawer dashboard-appointment-drawer" role="dialog" aria-modal="true" aria-labelledby="dashboard-appointment-title">
          <div className="drawer-head"><div><span>APPOINTMENT {selectedAppointment.id}</span><h2 id="dashboard-appointment-title">预约详情</h2><p>{selectedAppointment.store}</p></div><button aria-label="关闭" onClick={() => setSelectedAppointmentId(null)}><X size={19} /></button></div>
          <div className="dashboard-appointment-summary">
            <div><span>{selectedAppointment.customer.slice(0, 1)}</span><div><strong>{selectedAppointment.customer}</strong><small>{selectedAppointment.phone}</small></div><a href={`tel:${selectedAppointment.phone.replace(/\*/g, "")}`} aria-label={`联系${selectedAppointment.customer}`}><Phone size={17} /></a></div>
            <Status value={selectedAppointment.status} />
          </div>
          <div className="detail-time"><CalendarDays size={20} /><div><strong>{formatAppointmentDate(selectedAppointment.date)} · {selectedAppointment.time}</strong><span>{selectedAppointment.duration} 分钟 · {selectedAppointment.store}</span></div></div>
          <section className="detail-section"><span>服务信息</span><dl><div><dt>服务项目</dt><dd>{selectedAppointment.service}</dd></div><div><dt>服务员工</dt><dd>{selectedAppointment.employee}</dd></div><div><dt>项目金额</dt><dd>¥{selectedAppointment.price.toLocaleString("zh-CN")}</dd></div><div><dt>顾客备注</dt><dd>{selectedAppointment.note || "无"}</dd></div></dl></section>
          <section className="detail-section"><span>会员与订单</span><dl><div><dt>会员等级</dt><dd>{selectedCustomer?.level ?? "普通会员"}</dd></div><div><dt>支付状态</dt><dd>{selectedOrder ? selectedOrder.status : selectedAppointment.status === "已完成" ? "待结算" : "到店后结算"}</dd></div>{selectedOrder && <div><dt>订单编号</dt><dd>{selectedOrder.id}</dd></div>}</dl></section>
          <section className="dashboard-appointment-progress"><span>当前进度</span><div><i className="done"><Check size={12} /></i><p><strong>预约已创建</strong><small>{formatAppointmentDate(selectedAppointment.date)} {selectedAppointment.time}</small></p></div><div><i className={selectedAppointment.status !== "待确认" ? "done" : ""}>{selectedAppointment.status !== "待确认" && <Check size={12} />}</i><p><strong>{selectedAppointment.status}</strong><small>{["已完成", "已取消", "未到店"].includes(selectedAppointment.status) ? "该预约流程已结束" : "等待下一步处理"}</small></p></div></section>
          {availableTransitions.length ? <div className="dashboard-appointment-actions">{availableTransitions.map((status, index) => <button className={index === 0 ? "main" : "secondary"} key={status} onClick={() => advanceAppointment(status)}>{dashboardAppointmentActions[status]}</button>)}</div> : <div className="final-state"><Check size={18} /><span>{["已取消", "未到店"].includes(selectedAppointment.status) ? "该预约已结束" : "该预约当前无需处理"}</span></div>}
        </aside>
      </>}
      {visitDrawerOpen && <>
        <button className="commerce-scrim" aria-label="关闭今日到店会员" onClick={() => setVisitDrawerOpen(false)} />
        <aside className="commerce-drawer visit-member-drawer" role="dialog" aria-modal="true" aria-labelledby="visit-member-title">
          <div className="drawer-head"><div><span>TODAY'S VISITS</span><h2 id="visit-member-title">今日到店会员</h2><p>{scopeName} · 8月13日</p></div><button aria-label="关闭" onClick={() => setVisitDrawerOpen(false)}><X size={19} /></button></div>
          <div className="visit-member-summary"><div><strong>{visitEntries.length}</strong><span>到店会员</span></div><div><strong>{appointmentVisitCount}</strong><span>预约到店</span></div><div><strong>{walkInVisitCount}</strong><span>现场临客</span></div><div><strong>{newVisitCount}</strong><span>首次到店</span></div></div>
          <div className="visit-member-caption"><span>到店名单</span><small>同一会员当天多次服务仅计 1 位</small></div>
          <div className="visit-member-list">{visitEntries.map((entry) => <button key={entry.customerId} onClick={() => { if (!entry.appointmentId) return; setVisitDrawerOpen(false); setSelectedAppointmentId(entry.appointmentId); }} disabled={!entry.appointmentId}><span className="visit-member-avatar">{entry.customer.slice(0, 1)}</span><span><strong>{entry.customer}{entry.isNew && <i>新客</i>}</strong><small>{entry.time} · {entry.service}</small><small>{entry.employee} · {entry.source}</small></span><span className={`status status-${entry.status}`}>{entry.status}</span>{entry.appointmentId && <ChevronRight size={16} />}</button>)}</div>
          {visitEntries.length === 0 && <div className="visit-member-empty"><Users size={28} /><strong>今天还没有会员到店</strong><span>顾客登记到店或创建现场订单后会显示在这里</span></div>}
          <div className="visit-member-rule"><strong>统计口径</strong><p>今日预约状态为“已到店、服务中、已完成”的会员，以及今日现场开单会员；按会员去重，不含已确认但尚未到店的预约。</p></div>
        </aside>
      </>}
    </>
  );
}

function PlatformDashboard() {
  return (
    <>
      <div className="page-heading"><div><span className="date-line">平台运营中心</span><h1>业务总览</h1><p>追踪商家增长、活跃和服务健康度。</p></div><button className="primary-action"><Building2 size={17} /> 开通商家</button></div>
      <section className="stat-grid">
        <StatCard label="入驻商家" value="128" change="本月新增 12 家" icon={Building2} accent="#dff2e8" />
        <StatCard label="活跃门店" value="236" change="活跃率 94.6%" icon={Store} accent="#e7eefb" />
        <StatCard label="平台预约" value="18,492" change="较上月 +18.2%" icon={CalendarDays} accent="#f7ead9" />
        <StatCard label="即将到期" value="9 家" change="未来 30 天" icon={Clock3} accent="#f3e4e2" />
      </section>
      <section className="dashboard-grid">
        <article className="panel tenant-panel">
          <div className="panel-head"><div><h2>重点商家</h2><p>最近活跃与续费情况</p></div><button className="text-button">全部商家 <ArrowRight size={15} /></button></div>
          <div className="tenant-table table-header"><span>商家</span><span>门店数</span><span>本月预约</span><span>套餐状态</span></div>
          {[
            ["栖光美学", "2", "1,286", "正常"], ["MOMO 美研社", "4", "2,104", "正常"], ["云肌护理中心", "1", "640", "20 天后到期"], ["南枝 SPA", "3", "1,564", "正常"],
          ].map((row) => <div className="tenant-table" key={row[0]}><strong>{row[0]}</strong><span>{row[1]}</span><span>{row[2]}</span><span className={row[3] === "正常" ? "tenant-ok" : "tenant-warn"}>{row[3]}</span></div>)}
        </article>
        <aside className="right-stack">
          <article className="panel revenue-panel"><div className="panel-head"><div><h2>平台增长</h2><p>近 7 日活跃门店</p></div><span className="trend">+14.6%</span></div><RevenueChart /></article>
          <article className="panel quick-panel"><h2>快捷操作</h2><div><button><Building2 size={18} />新建商家</button><button><PackageCheck size={18} />配置套餐</button><button><Bell size={18} />发布公告</button><button><ShieldCheck size={18} />查看日志</button></div></article>
        </aside>
      </section>
    </>
  );
}

function Workspace({ role }: { role: Role }) {
  const logout = useSession((state) => state.logout);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedPage = searchParams.get("page");
  const privateShop = searchParams.get("shop");
  const validPages = [...menus[role].map((item) => item.label), "消息", "售后"];
  const active = requestedPage && validPages.includes(requestedPage) ? requestedPage : menus[role][0].label;
  const setActive = (page: string) => setSearchParams(privateShop ? { role: "customer", page, shop: privateShop } : { role, page });
  const leaveWorkspace = () => {
    logout();
    setSearchParams({});
  };
  const [mobileMenu, setMobileMenu] = useState(false);
  const [storeMenuOpen, setStoreMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [tenantComposerOpen, setTenantComposerOpen] = useState(false);
  const [selectedPlatformTenantId, setSelectedPlatformTenantId] = useState<string | null>(null);
  const [selectedMarketplaceStore, setSelectedMarketplaceStore] = useState<MarketplaceStore | null>(null);
  const [selectedBookingOffer, setSelectedBookingOffer] = useState<BookingOffer | null>(null);
  const setCustomerStoreId = useCustomerContext((state) => state.setStoreId);
  const user = useMemo(() => demoUsers.find((item) => item.role === role)!, [role]);
  const stores = useOperations((state) => state.stores);
  const selectedStoreId = useMerchantScope((state) => state.selectedStoreId);
  const setSelectedStoreId = useMerchantScope((state) => state.setSelectedStoreId);
  const effectiveStoreId = role === "owner" ? selectedStoreId : user.storeId ?? DEMO_CONTEXT.defaultStoreId;
  const selectedStoreName = stores.find((store) => store.id === effectiveStoreId)?.name ?? "全部门店";

  useEffect(() => {
    if (!["owner", "platform", "customer"].includes(role) && user.storeId && selectedStoreId !== user.storeId) {
      setSelectedStoreId(user.storeId);
    }
  }, [role, selectedStoreId, setSelectedStoreId, user.storeId]);

  if (role === "customer") {
    const startBooking = (store: MarketplaceStore, offer?: BookingOffer) => { setCustomerStoreId(store.id); setSelectedMarketplaceStore(store); setSelectedBookingOffer(offer ?? null); setActive("预约"); };
    const customerContent = active === "预约"
      ? <CustomerBooking key={`${selectedMarketplaceStore?.id ?? "appointment-list"}-${selectedBookingOffer?.activityId ?? "standard"}`} selectedStore={selectedMarketplaceStore} bookingOffer={selectedBookingOffer} onChooseStore={() => { setSelectedMarketplaceStore(null); setSelectedBookingOffer(null); setActive("首页"); }} onBack={() => setActive("首页")} />
      : active === "权益"
        ? <CustomerAssets />
        : active === "售后"
          ? <CustomerAfterSales onBack={() => setActive("我的")} />
        : active === "消息"
          ? <CustomerNotifications onBack={() => setActive("首页")} />
        : active === "我的"
          ? <CustomerProfile onNavigate={setActive} onSwitchRole={leaveWorkspace} />
          : <CustomerMarketplace selectedStore={selectedMarketplaceStore} onSelectStore={setSelectedMarketplaceStore} onBook={startBooking} onNavigate={setActive} />;
    const showAdvisor = active !== "预约" && active !== "消息" && active !== "售后";
    const activeCustomerTab = active === "消息" ? "首页" : active === "售后" ? "我的" : active;
    return <>{customerContent}{showAdvisor && <AiAdvisor onBook={startBooking} />}<nav className="mobile-tabbar" aria-label="顾客端主导航">{menus.customer.map(({ label, icon: Icon }) => <button className={activeCustomerTab === label ? "active" : ""} key={label} onClick={() => { setSelectedMarketplaceStore(null); setSelectedBookingOffer(null); setActive(label); }}><Icon size={20} /><span>{label}</span></button>)}</nav></>;
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "open" : ""}`}>
        <div className="sidebar-top"><Brand onClick={() => { setActive(menus[role][0].label); setMobileMenu(false); }} /><button className="menu-close" onClick={() => setMobileMenu(false)}><X size={20} /></button></div>
        <div className="workspace-label"><span>{role === "platform" ? "PLATFORM" : "MERCHANT"}</span><strong>{role === "platform" ? "栖光运营中心" : "栖光美学"}</strong></div>
        <nav>{menus[role].map(({ label, icon: Icon }) => <button key={label} className={active === label ? "active" : ""} onClick={() => { setActive(label); setMobileMenu(false); }}><Icon size={18} /><span>{label}</span></button>)}</nav>
        <div className="sidebar-help"><Sparkles size={18} /><strong>产品体验版</strong><span>当前为前端演示环境</span></div>
        <button className="profile" onClick={leaveWorkspace}><span className={`avatar avatar-${role}`}>{user.name.slice(0, 1)}</span><span><strong>{user.name}</strong><small>{roleLabels[role]}</small></span><LogOut size={17} /></button>
      </aside>
      {mobileMenu && <button className="scrim" onClick={() => setMobileMenu(false)} aria-label="关闭菜单" />}
      <main className="main-area">
        <header className="topbar"><button className="mobile-menu" onClick={() => setMobileMenu(true)}><Menu size={20} /></button><div className="search"><Search size={17} /><input placeholder="搜索会员、订单或预约" /></div><div className="topbar-actions">{role !== "platform" && <div className="store-switcher"><button className={`store-select ${storeMenuOpen ? "open" : ""}`} onClick={() => role === "owner" && setStoreMenuOpen((open) => !open)} aria-haspopup="listbox" aria-expanded={storeMenuOpen}><Store size={16} /><span>{selectedStoreName}</span>{role === "owner" && <ChevronDown size={14} />}</button>{storeMenuOpen && <><button className="store-menu-scrim" onClick={() => setStoreMenuOpen(false)} aria-label="关闭门店菜单" /><div className="store-menu" role="listbox" aria-label="经营门店"><button className={!selectedStoreId ? "selected" : ""} onClick={() => { setSelectedStoreId(null); setStoreMenuOpen(false); }}><span><Building2 size={16} /><span><strong>全部门店</strong><small>查看品牌汇总数据</small></span></span>{!selectedStoreId && <Check size={15} />}</button>{stores.map((store) => <button className={selectedStoreId === store.id ? "selected" : ""} key={store.id} onClick={() => { setSelectedStoreId(store.id); setStoreMenuOpen(false); }}><span><Store size={16} /><span><strong>{store.name}</strong><small>{store.status} · {store.address.replace("上海市", "")}</small></span></span>{selectedStoreId === store.id && <Check size={15} />}</button>)}</div></>}</div>}<div className="topbar-popover-wrap"><button className="icon-button" aria-label="通知" aria-haspopup="dialog" aria-expanded={notificationOpen} onClick={() => { setNotificationOpen((open) => !open); setAccountMenuOpen(false); }}><Bell size={18} /><i /></button>{notificationOpen && <><button className="topbar-menu-scrim" aria-label="关闭通知" onClick={() => setNotificationOpen(false)} /><aside className="topbar-popover notification-popover"><header><div><strong>通知中心</strong><span>3 条待处理</span></div><button onClick={() => setNotificationOpen(false)} aria-label="关闭通知"><X size={16} /></button></header><button onClick={() => { setActive(role === "platform" ? "平台日志" : menus[role][0].label); setNotificationOpen(false); }}><span className="notification-icon important"><ShieldCheck size={16} /></span><span><strong>{role === "platform" ? "悦己生活馆服务已冻结" : "今日预约需要处理"}</strong><small>{role === "platform" ? "套餐到期且未完成续费" : "请进入工作台查看待处理事项"}</small><time>10:12</time></span><ChevronRight size={15} /></button><button onClick={() => { setActive(role === "platform" ? "商家管理" : menus[role][0].label); setNotificationOpen(false); }}><span className="notification-icon"><Building2 size={16} /></span><span><strong>{role === "platform" ? "MOMO 美研社续期成功" : "经营数据已更新"}</strong><small>{role === "platform" ? "专业版服务已延长 12 个月" : "最新经营数据已同步"}</small><time>11:26</time></span><ChevronRight size={15} /></button><button className="notification-more" onClick={() => { setActive(role === "platform" ? "系统公告" : menus[role][0].label); setNotificationOpen(false); }}>查看全部通知</button></aside></>}</div><div className="topbar-popover-wrap"><button className={`top-avatar top-avatar-button ${accountMenuOpen ? "open" : ""}`} aria-label="账户菜单" aria-haspopup="menu" aria-expanded={accountMenuOpen} onClick={() => { setAccountMenuOpen((open) => !open); setNotificationOpen(false); }}>{user.name.slice(0, 1)}</button>{accountMenuOpen && <><button className="topbar-menu-scrim" aria-label="关闭账户菜单" onClick={() => setAccountMenuOpen(false)} /><div className="account-popover topbar-popover" role="menu"><div className="account-summary"><span className={`avatar avatar-${role}`}>{user.name.slice(0, 1)}</span><span><strong>{user.name}</strong><small>{roleLabels[role]}</small></span></div>{role === "platform" && <button role="menuitem" onClick={() => { setActive("平台设置"); setAccountMenuOpen(false); }}><Settings size={16} /><span>平台设置</span></button>}<button className="account-logout" role="menuitem" onClick={leaveWorkspace}><LogOut size={16} /><span>退出登录</span></button></div></>}</div></div></header>
        <div className="page-content">{
          active === menus[role][0].label
            ? (role === "platform" ? <PlatformOverview onNavigate={setActive} onOpenTenant={() => { setTenantComposerOpen(true); setActive("商家管理"); }} onSelectTenant={(tenantId) => { setSelectedPlatformTenantId(tenantId); setActive("商家管理"); }} /> : <MerchantDashboard role={role} onNavigate={setActive} />)
            : (["预约日历", "预约接待", "我的日程"].includes(active)
              ? <AppointmentCenter role={role} />
              : ["会员管理", "会员查询"].includes(active)
                ? <CustomerCenter />
                : active === "订单管理"
                  ? <OrderCenter />
                  : active === "开单收银"
                    ? <OrderCenter cashier />
                    : active === "收银核销"
                      ? <OrderCenter cashier title="收银核销" autoOpenComposer={false} />
                    : ["售后管理", "售后处理"].includes(active)
                      ? <AfterSaleCenter role={role} />
                    : active === "服务与次卡"
                      ? <ServiceManagement />
                      : active === "营销活动"
                        ? <MarketingManagement />
                        : active === "私域店铺"
                          ? <PrivateStoreCenter />
                      : ["经营报表", "本店报表", "个人业绩"].includes(active)
                        ? <BusinessReport role={role} />
                        : active === "商家管理"
                          ? <TenantManagement composerOpen={tenantComposerOpen} onComposerOpen={() => setTenantComposerOpen(true)} onComposerClose={() => setTenantComposerOpen(false)} selectedId={selectedPlatformTenantId} onSelectTenant={setSelectedPlatformTenantId} />
                          : active === "套餐管理"
                            ? <PlanManagement />
                            : active === "平台日志"
                              ? <PlatformLogs />
                              : active === "员工管理"
                                ? <StaffManagement />
                                : active === "员工排班"
                                  ? <StaffManagement scheduleMode />
                                  : active === "门店管理"
                                    ? <StoreManagement />
                                    : active === "我的顾客"
                                      ? <CustomerCenter />
                                      : active === "平台设置"
                                        ? <DemoSettings />
                                        : active === "系统公告"
                                          ? <SystemAnnouncements />
                      : <EmptyModule title={active} />)
        }</div>
      </main>
    </div>
  );
}

function EmptyModule({ title }: { title: string }) {
  return <section className="module-placeholder"><div className="placeholder-icon"><ClipboardList size={30} /></div><span>下一阶段</span><h1>{title}</h1><p>模块入口已经接入角色权限，业务功能将在后续里程碑中逐步完成。</p></section>;
}

export default function App() {
  const role = useSession((state) => state.role);
  const [searchParams] = useSearchParams();
  return searchParams.get("shop") ? <Workspace role="customer" /> : role ? <Workspace role={role} /> : <Login />;
}
