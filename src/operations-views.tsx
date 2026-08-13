import { useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  Check,
  Clock3,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Store,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useAfterSales, useAppointments, useCommerce, useInventory, useMerchantScope, useOperations, usePlatform } from "./store";
import { useCustomerContext, useCustomerMarketing } from "./store";
import { addDays, DEMO_TODAY } from "./demo-context";
import type { Role, StaffMember, StaffSchedule, StoreInfo } from "./types";

const currency = (value: number) => `¥${value.toLocaleString("zh-CN")}`;

export function StaffManagement({ scheduleMode = false }: { scheduleMode?: boolean }) {
  const staff = useOperations((state) => state.staff);
  const stores = useOperations((state) => state.stores);
  const schedules = useOperations((state) => state.schedules);
  const toggleStaffStatus = useOperations((state) => state.toggleStaffStatus);
  const saveStaff = useOperations((state) => state.saveStaff);
  const setScheduleType = useOperations((state) => state.setScheduleType);
  const saveSchedules = useOperations((state) => state.saveSchedules);
  const services = useOperations((state) => state.services);
  const orders = useCommerce((state) => state.orders);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<StaffMember | null>(null);
  const [activeDate, setActiveDate] = useState(DEMO_TODAY);
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchDates, setBatchDates] = useState<string[]>([]);
  const [batchStaffIds, setBatchStaffIds] = useState<string[]>([]);
  const [batchType, setBatchType] = useState<StaffSchedule["type"]>("上班");
  const [batchStart, setBatchStart] = useState("09:30");
  const [batchEnd, setBatchEnd] = useState("18:30");
  const selectedStoreId = useMerchantScope((state) => state.selectedStoreId);
  const scopeName = stores.find((store) => store.id === selectedStoreId)?.name ?? "全部门店";
  const selected = staff.find((item) => item.id === selectedId && (!selectedStoreId || item.storeId === selectedStoreId)) ?? null;
  const filtered = staff.filter((item) => (!selectedStoreId || item.storeId === selectedStoreId) && `${item.name}${item.phone}${item.title}`.includes(query));
  const performance = (name: string) => orders.filter((order) => order.employee === name && order.status === "已完成").reduce((sum, order) => sum + order.payable, 0);
  const openNew = () => setDraft({ id: `E${Date.now()}`, name: "", phone: "", title: "美容师", role: "员工", storeId: stores[0]?.id ?? "", services: [], serviceIds: [], status: "在职", joinedAt: DEMO_TODAY, monthlyTarget: 20000 });
  const submit = () => {
    if (!draft?.name.trim() || !draft.phone.trim() || !draft.storeId) return;
    saveStaff({ ...draft, name: draft.name.trim(), phone: draft.phone.trim(), services: services.filter((service) => draft.serviceIds.includes(service.id)).map((service) => service.name) });
    setDraft(null);
  };

  if (scheduleMode) {
    const scheduleDates = Array.from({ length: 7 }, (_, index) => addDays(DEMO_TODAY, index));
    const scheduleStaff = staff.filter((member) => (!selectedStoreId || member.storeId === selectedStoreId) && member.status === "在职");
    const openBatch = () => {
      setBatchDates([activeDate]);
      setBatchStaffIds(scheduleStaff.map((member) => member.id));
      setBatchType("上班");
      setBatchStart("09:30");
      setBatchEnd("18:30");
      setBatchOpen(true);
    };
    const toggleBatchDate = (date: string) => setBatchDates((dates) => dates.includes(date) ? dates.filter((item) => item !== date) : [...dates, date]);
    const toggleBatchStaff = (staffId: string) => setBatchStaffIds((ids) => ids.includes(staffId) ? ids.filter((item) => item !== staffId) : [...ids, staffId]);
    const applyBatch = () => {
      if (!batchDates.length || !batchStaffIds.length || (batchType === "上班" && batchStart >= batchEnd)) return;
      saveSchedules(batchDates.flatMap((date) => batchStaffIds.map((employeeId) => ({
        id: `SH-${employeeId}-${date}`,
        employeeId,
        date,
        startTime: batchStart,
        endTime: batchEnd,
        type: batchType,
      }))));
      setActiveDate([...batchDates].sort()[0]);
      setBatchOpen(false);
    };
    return <>
      <div className="page-heading"><div><span className="date-line">STAFF SCHEDULE</span><h1>员工排班</h1><p>管理本店员工出勤与可预约时间。</p></div><button className="primary-action" onClick={openBatch}><CalendarClock size={17} /> 批量排班</button></div>
      <article className="panel schedule-management"><div className="schedule-toolbar"><div className="schedule-week">{scheduleDates.map((date, index) => <button className={activeDate === date ? "active" : ""} key={date} onClick={() => setActiveDate(date)}><span>{index === 0 ? "今天" : `周${"日一二三四五六"[new Date(`${date}T00:00:00`).getDay()]}`}</span><strong>{date.slice(-2)}</strong></button>)}</div><div className="schedule-legend"><span><i className="work" />上班</span><span><i className="rest" />休息</span><span><i className="leave" />请假</span></div></div><div className="staff-schedule-head"><span>员工</span><span>班次时间</span><span>排班状态</span><span>当日预约</span><span /></div>{scheduleStaff.map((member) => { const schedule = schedules.find((item) => item.employeeId === member.id && item.date === activeDate); const appointmentCount = useAppointments.getState().appointments.filter((item) => item.employeeId === member.id && item.date === activeDate).length; return <div className="staff-schedule-row" key={member.id}><span><i>{member.name.slice(0, 1)}</i><span><strong>{member.name}</strong><small>{member.title}</small></span></span><span>{schedule?.type === "上班" ? `${schedule.startTime} - ${schedule.endTime}` : "-"}</span><span className={`schedule-state schedule-${schedule?.type ?? "未排班"}`}>{schedule?.type ?? "未排班"}</span><strong>{appointmentCount} 单</strong><select aria-label={`${member.name}排班状态`} value={schedule?.type ?? ""} onChange={(event) => setScheduleType(member.id, activeDate, event.target.value ? event.target.value as StaffSchedule["type"] : null)}><option value="">未排班</option><option>上班</option><option>休息</option><option>请假</option></select></div>; })}</article>
      {batchOpen && <><button className="commerce-scrim" aria-label="关闭批量排班" onClick={() => setBatchOpen(false)} /><aside className="commerce-drawer batch-schedule-drawer"><div className="drawer-head"><div><span>BATCH SCHEDULE</span><h2>批量排班</h2><p>{scopeName} · 统一设置多人多日班次</p></div><button aria-label="关闭" onClick={() => setBatchOpen(false)}><X size={19} /></button></div><section className="batch-schedule-section"><div className="batch-section-head"><h3>选择日期</h3><button onClick={() => setBatchDates(batchDates.length === scheduleDates.length ? [] : scheduleDates)}>{batchDates.length === scheduleDates.length ? "取消全选" : "全选"}</button></div><div className="batch-date-options">{scheduleDates.map((date, index) => <button className={batchDates.includes(date) ? "selected" : ""} key={date} onClick={() => toggleBatchDate(date)}><span>{index === 0 ? "今天" : `周${"日一二三四五六"[new Date(`${date}T00:00:00`).getDay()]}`}</span><strong>{date.slice(-2)}</strong>{batchDates.includes(date) && <Check size={12} />}</button>)}</div></section><section className="batch-schedule-section"><div className="batch-section-head"><h3>选择员工</h3><button onClick={() => setBatchStaffIds(batchStaffIds.length === scheduleStaff.length ? [] : scheduleStaff.map((member) => member.id))}>{batchStaffIds.length === scheduleStaff.length ? "取消全选" : "全选"}</button></div><div className="batch-staff-options">{scheduleStaff.map((member) => <label key={member.id}><input type="checkbox" checked={batchStaffIds.includes(member.id)} onChange={() => toggleBatchStaff(member.id)} /><span><strong>{member.name}</strong><small>{member.title}</small></span></label>)}</div></section><section className="batch-schedule-section"><h3>排班状态</h3><div className="batch-type-options">{(["上班", "休息", "请假"] as StaffSchedule["type"][]).map((type) => <button className={batchType === type ? "selected" : ""} key={type} onClick={() => setBatchType(type)}><i className={type === "上班" ? "work" : type === "休息" ? "rest" : "leave"} />{type}{batchType === type && <Check size={13} />}</button>)}</div></section>{batchType === "上班" && <section className="batch-schedule-section"><h3>班次时间</h3><div className="batch-time-fields"><label><span>开始时间</span><input type="time" value={batchStart} onInput={(event) => setBatchStart(event.currentTarget.value)} /></label><label><span>结束时间</span><input type="time" value={batchEnd} onInput={(event) => setBatchEnd(event.currentTarget.value)} /></label></div>{batchStart >= batchEnd && <p className="batch-schedule-error">结束时间必须晚于开始时间</p>}</section>}<div className="batch-schedule-summary"><span>将更新</span><strong>{batchStaffIds.length} 人 × {batchDates.length} 天</strong></div><button className="drawer-primary" disabled={!batchDates.length || !batchStaffIds.length || (batchType === "上班" && batchStart >= batchEnd)} onClick={applyBatch}><Check size={17} />确认批量排班</button></aside></>}
    </>;
  }

  return <>
    <div className="page-heading"><div><span className="date-line">TEAM MANAGEMENT</span><h1>员工管理</h1><p>管理员工信息、服务能力与账号状态。</p></div><button className="primary-action" onClick={openNew}><Plus size={17} /> 新增员工</button></div>
    <section className="team-metrics"><div><Users size={19} /><span><strong>{filtered.filter((item) => item.status === "在职").length}</strong>在职员工</span></div><div><UserRound size={19} /><span><strong>{filtered.filter((item) => item.role === "店长").length}</strong>门店店长</span></div><div><Clock3 size={19} /><span><strong>{schedules.filter((item) => item.type === "上班" && filtered.some((member) => member.id === item.employeeId)).length}</strong>今日出勤</span></div></section>
      <article className="panel team-panel"><div className="team-toolbar"><div className="inline-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索员工姓名或手机号" /></div><button><Store size={15} />{scopeName}</button></div><div className="team-row team-head"><span>员工</span><span>角色与门店</span><span>服务项目</span><span>本月业绩</span><span>状态</span><span /></div>{filtered.map((member) => { const store = stores.find((item) => item.id === member.storeId); return <div className="team-row" key={member.id}><span><i>{member.name.slice(0, 1)}</i><span><strong>{member.name}</strong><small>{member.phone} · 入职 {member.joinedAt}</small></span></span><span><strong>{member.role}</strong><small>{store?.name}</small></span><span>{member.services.slice(0, 2).join("、") || "无需配置服务"}</span><strong>{currency(performance(member.name))}</strong><span className={`staff-status status-${member.status}`}>{member.status}</span><button onClick={() => setSelectedId(member.id)}><MoreHorizontal size={17} /></button></div>; })}</article>
    {(selected || draft) && <div className="commerce-scrim" onClick={() => { setSelectedId(null); setDraft(null); }} />}
    {selected && !draft && <aside className="commerce-drawer"><div className="drawer-head"><div><span>STAFF {selected.id}</span><h2>员工详情</h2></div><button onClick={() => setSelectedId(null)}><X size={19} /></button></div><div className="staff-detail-head"><span>{selected.name.slice(0, 1)}</span><div><h3>{selected.name}</h3><p>{selected.title} · {selected.role}</p></div><span className={`staff-status status-${selected.status}`}>{selected.status}</span></div><dl className="staff-detail-list"><div><dt>所属门店</dt><dd>{stores.find((item) => item.id === selected.storeId)?.name}</dd></div><div><dt>联系电话</dt><dd>{selected.phone}</dd></div><div><dt>入职时间</dt><dd>{selected.joinedAt}</dd></div><div><dt>本月目标</dt><dd>{currency(selected.monthlyTarget)}</dd></div></dl><div className="staff-services"><span>可服务项目</span>{selected.services.map((service) => <i key={service}><Check size={12} />{service}</i>)}</div><div className="drawer-action-row"><button onClick={() => { setDraft({ ...selected, serviceIds: [...selected.serviceIds], services: [...selected.services] }); setSelectedId(null); }}>编辑资料</button><button className={selected.status === "在职" ? "danger" : "success"} onClick={() => toggleStaffStatus(selected.id)}>{selected.status === "在职" ? "停用账号" : "恢复账号"}</button></div></aside>}
    {draft && <aside className="commerce-drawer"><div className="drawer-head"><div><span>STAFF PROFILE</span><h2>{staff.some((item) => item.id === draft.id) ? "编辑员工" : "新增员工"}</h2></div><button onClick={() => setDraft(null)}><X size={19} /></button></div><div className="drawer-form"><label><span>员工姓名</span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="请输入员工姓名" /></label><label><span>手机号码</span><input value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} placeholder="用于登录和联系" /></label><div className="form-pair"><label><span>职位名称</span><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label><label><span>账号角色</span><select value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value as StaffMember["role"] })}><option>员工</option><option>前台</option><option>店长</option></select></label></div><label><span>所属门店</span><select value={draft.storeId} onChange={(event) => setDraft({ ...draft, storeId: event.target.value })}>{stores.map((store) => <option value={store.id} key={store.id}>{store.name}</option>)}</select></label><div className="form-pair"><label><span>入职日期</span><input type="date" value={draft.joinedAt} onChange={(event) => setDraft({ ...draft, joinedAt: event.target.value })} /></label><label><span>本月目标</span><input type="number" min="0" value={draft.monthlyTarget} onChange={(event) => setDraft({ ...draft, monthlyTarget: Number(event.target.value) })} /></label></div><fieldset className="choice-field"><legend>可服务项目</legend>{services.filter((service) => service.merchantId === "T001").map((service) => <label key={service.id}><input type="checkbox" checked={draft.serviceIds.includes(service.id)} onChange={() => setDraft({ ...draft, serviceIds: draft.serviceIds.includes(service.id) ? draft.serviceIds.filter((id) => id !== service.id) : [...draft.serviceIds, service.id] })} /><span>{service.name}</span></label>)}</fieldset></div><button className="drawer-primary drawer-submit" disabled={!draft.name.trim() || !draft.phone.trim() || !draft.storeId} onClick={submit}><Check size={17} /> 保存员工资料</button></aside>}
  </>;
}

export function StoreManagement() {
  const stores = useOperations((state) => state.stores);
  const staff = useOperations((state) => state.staff);
  const toggleStoreStatus = useOperations((state) => state.toggleStoreStatus);
  const saveStore = useOperations((state) => state.saveStore);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<StoreInfo | null>(null);
  const selected = stores.find((store) => store.id === selectedId) ?? null;
  const openNew = () => setDraft({ id: `MS${Date.now()}`, merchantId: "T001", name: "", address: "", phone: "", manager: staff.find((item) => item.role === "店长")?.name ?? "", businessHours: "09:30 - 21:00", status: "营业中", members: 0, employees: 0, monthlyRevenue: 0 });
  const submit = () => {
    if (!draft?.name.trim() || !draft.address.trim() || !draft.phone.trim()) return;
    saveStore({ ...draft, name: draft.name.trim(), address: draft.address.trim(), phone: draft.phone.trim() });
    setDraft(null);
  };
  return <>
    <div className="page-heading"><div><span className="date-line">STORE NETWORK</span><h1>门店管理</h1><p>查看门店状态、团队配置和经营概况。</p></div><button className="primary-action" onClick={openNew}><Plus size={17} /> 新增门店</button></div>
    <section className="store-grid">{stores.map((store, index) => <article className="store-card" key={store.id}><div className={`store-cover store-cover-${index + 1}`}><Store size={31} /><span className={`store-business business-${store.status}`}>{store.status}</span></div><div className="store-card-body"><div><h2>{store.name}</h2><button onClick={() => setSelectedId(store.id)}><MoreHorizontal size={18} /></button></div><p><MapPin size={14} />{store.address}</p><dl><div><dt>本月营业额</dt><dd>{currency(store.monthlyRevenue)}</dd></div><div><dt>会员数</dt><dd>{store.members}</dd></div><div><dt>员工数</dt><dd>{staff.filter((item) => item.storeId === store.id && item.status === "在职").length}</dd></div></dl><footer><span><UserRound size={14} />店长 {store.manager}</span><button onClick={() => setSelectedId(store.id)}>管理门店 <ArrowRight size={14} /></button></footer></div></article>)}</section>
    {(selected || draft) && <div className="commerce-scrim" onClick={() => { setSelectedId(null); setDraft(null); }} />}
    {selected && !draft && <aside className="commerce-drawer"><div className="drawer-head"><div><span>STORE {selected.id}</span><h2>门店设置</h2></div><button onClick={() => setSelectedId(null)}><X size={19} /></button></div><div className="store-drawer-title"><span><Store size={24} /></span><div><h3>{selected.name}</h3><p>{selected.status}</p></div></div><dl className="staff-detail-list"><div><dt>门店地址</dt><dd>{selected.address}</dd></div><div><dt>联系电话</dt><dd>{selected.phone}</dd></div><div><dt>营业时间</dt><dd>{selected.businessHours}</dd></div><div><dt>门店店长</dt><dd>{selected.manager}</dd></div></dl><div className="drawer-action-row"><button onClick={() => { setDraft({ ...selected }); setSelectedId(null); }}>编辑门店</button><button className={selected.status === "营业中" ? "danger" : "success"} onClick={() => toggleStoreStatus(selected.id)}>{selected.status === "营业中" ? "暂停营业" : "恢复营业"}</button></div></aside>}
    {draft && <aside className="commerce-drawer"><div className="drawer-head"><div><span>STORE PROFILE</span><h2>{stores.some((item) => item.id === draft.id) ? "编辑门店" : "新增门店"}</h2></div><button onClick={() => setDraft(null)}><X size={19} /></button></div><div className="drawer-form"><label><span>门店名称</span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="例如：静安旗舰店" /></label><label><span>门店地址</span><input value={draft.address} onChange={(event) => setDraft({ ...draft, address: event.target.value })} placeholder="请输入详细地址" /></label><label><span>联系电话</span><input value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} /></label><label><span>营业时间</span><input value={draft.businessHours} onChange={(event) => setDraft({ ...draft, businessHours: event.target.value })} placeholder="09:30 - 21:00" /></label><label><span>门店店长</span><select value={draft.manager} onChange={(event) => setDraft({ ...draft, manager: event.target.value })}><option value="">暂未分配</option>{staff.map((member) => <option value={member.name} key={member.id}>{member.name} · {member.role}</option>)}</select></label></div><button className="drawer-primary drawer-submit" disabled={!draft.name.trim() || !draft.address.trim() || !draft.phone.trim()} onClick={submit}><Check size={17} /> 保存门店资料</button></aside>}
  </>;
}

export function DemoSettings() {
  const resetAppointments = useAppointments((state) => state.resetAppointments);
  const resetCommerce = useCommerce((state) => state.resetCommerce);
  const resetPlatform = usePlatform((state) => state.resetPlatform);
  const resetOperations = useOperations((state) => state.resetOperations);
  const resetMarketing = useCustomerMarketing((state) => state.resetMarketing);
  const resetAfterSales = useAfterSales((state) => state.resetAfterSales);
  const resetContext = useCustomerContext((state) => state.resetContext);
  const resetInventory = useInventory((state) => state.resetInventory);
  const [done, setDone] = useState(false);
  const reset = () => {
    resetAppointments();
    resetCommerce();
    resetPlatform();
    resetOperations();
    resetMarketing();
    resetAfterSales();
    resetContext();
    resetInventory();
    setDone(true);
  };
  return <section className="settings-page"><div className="settings-heading"><span>DEMO ENVIRONMENT</span><h1>演示环境设置</h1><p>用于恢复演示数据和了解当前版本边界。</p></div><article className="settings-band"><div><Building2 size={22} /><span><strong>本地数据模式</strong><small>所有数据保存在当前浏览器，不会上传服务器。</small></span></div><i>已启用</i></article><article className="settings-section"><h2>数据管理</h2><p>重置后将恢复初始预约、会员、订单、次卡、商家和员工数据。</p><button onClick={reset}>{done ? <><Check size={16} />已恢复初始数据</> : "恢复演示数据"}</button></article><article className="settings-section version"><h2>版本信息</h2><dl><div><dt>产品版本</dt><dd>前端 MVP 0.5</dd></div><div><dt>数据存储</dt><dd>Zustand + localStorage</dd></div><div><dt>后端连接</dt><dd>未连接</dd></div></dl></article></section>;
}
