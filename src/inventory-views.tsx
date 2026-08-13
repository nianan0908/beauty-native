import { useMemo, useState } from "react";
import { AlertTriangle, ArrowDownToLine, Check, ClipboardCheck, PackageOpen, Plus, Search, ShieldAlert, X } from "lucide-react";
import { DEMO_CONTEXT } from "./demo-context";
import { inventoryHealth, projectedUsage } from "./inventory-rules";
import { useAppointments, useInventory, useMerchantScope, useOperations } from "./store";
import type { ConsumableStock, Role } from "./types";

const number = (value: number) => value.toLocaleString("zh-CN", { maximumFractionDigits: 2 });

export function InventoryManagement({ role }: { role: Role }) {
  const consumables = useInventory((state) => state.consumables);
  const stocks = useInventory((state) => state.stocks);
  const transactions = useInventory((state) => state.transactions);
  const restock = useInventory((state) => state.restock);
  const updateStockSettings = useInventory((state) => state.updateStockSettings);
  const approveRequest = useInventory((state) => state.approveRequest);
  const rejectRequest = useInventory((state) => state.rejectRequest);
  const stores = useOperations((state) => state.stores);
  const services = useOperations((state) => state.services);
  const appointments = useAppointments((state) => state.appointments);
  const selectedStoreId = useMerchantScope((state) => state.selectedStoreId);
  const storeId = role === "manager" ? DEMO_CONTEXT.defaultStoreId : selectedStoreId;
  const [tab, setTab] = useState<"库存概览" | "待审批" | "库存流水" | "异常分析">("库存概览");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ConsumableStock | null>(null);
  const [incoming, setIncoming] = useState(0);
  const [safetyStock, setSafetyStock] = useState(0);

  const scopedStocks = stocks.filter((stock) => !storeId || stock.storeId === storeId);
  const rows = scopedStocks.map((stock) => {
    const item = consumables.find((current) => current.id === stock.consumableId)!;
    const forecast = projectedUsage(stock.consumableId, stock.storeId, appointments, services);
    return { stock, item, forecast, health: inventoryHealth(stock, forecast), store: stores.find((current) => current.id === stock.storeId) };
  }).filter((row) => row.item && `${row.item.name}${row.item.category}${row.store?.name ?? ""}`.includes(query));
  const scopedTransactions = transactions.filter((item) => !storeId || item.storeId === storeId);
  const pending = scopedTransactions.filter((item) => item.status === "待审批");
  const lowCount = rows.filter((row) => row.health.status !== "充足").length;
  const inventoryValue = rows.reduce((sum, row) => sum + row.stock.quantity * row.item.unitCost, 0);
  const anomalies = useMemo(() => scopedTransactions.filter((item) => item.status !== "已驳回" && (
    (item.type === "额外领用" && item.quantity >= 2) || item.type === "报损" || (item.type === "额外领用" && !item.appointmentId)
  )), [scopedTransactions]);

  const openStock = (stock: ConsumableStock) => { setEditing(stock); setIncoming(0); setSafetyStock(stock.safetyStock); };
  const saveStock = () => {
    if (!editing) return;
    updateStockSettings(editing.storeId, editing.consumableId, safetyStock);
    if (incoming > 0) restock(editing.storeId, editing.consumableId, incoming, role === "owner" ? "林知夏" : "陈妍");
    setEditing(null);
  };

  return <>
    <div className="page-heading"><div><span className="date-line">CONSUMABLE INVENTORY</span><h1>耗材管理</h1><p>{role === "owner" ? "查看全部门店库存、补货需求和员工异常领用。" : "管理本店入库、补货、审批和库存核对。"}</p></div><button className="primary-action" onClick={() => rows[0] && openStock(rows[0].stock)}><Plus size={17} /> 耗材入库</button></div>
    <section className="inventory-metrics"><div><PackageOpen size={19} /><span><strong>{rows.length}</strong>在库耗材</span></div><div className={lowCount ? "warning" : ""}><AlertTriangle size={19} /><span><strong>{lowCount}</strong>需要关注</span></div><div><ClipboardCheck size={19} /><span><strong>{pending.length}</strong>待审批</span></div><div><ArrowDownToLine size={19} /><span><strong>¥{number(inventoryValue)}</strong>库存金额</span></div></section>
    <div className="inventory-tabs">{(["库存概览", "待审批", "库存流水", "异常分析"] as const).map((item) => <button className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>{item}{item === "待审批" && pending.length > 0 && <i>{pending.length}</i>}</button>)}</div>

    {tab === "库存概览" && <article className="panel inventory-panel"><div className="inventory-toolbar"><div className="inline-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索耗材或门店" /></div><span>已扣除未来有效预约预计用量</span></div><div className="inventory-row inventory-head"><span>耗材</span><span>门店</span><span>当前库存</span><span>预约占用</span><span>安全库存</span><span>状态</span><span /></div>{rows.map(({ stock, item, forecast, health, store }) => <div className="inventory-row" key={stock.id}><span><i>{item.name.slice(0, 1)}</i><span><strong>{item.name}</strong><small>{item.category} · ¥{number(item.unitCost)}/{item.unit}</small></span></span><span>{store?.name}</span><strong>{number(stock.quantity)} {item.unit}</strong><span>{number(forecast)} {item.unit}</span><span>{number(stock.safetyStock)} {item.unit}</span><span className={`inventory-state state-${health.status}`}>{health.status}{health.shortage > 0 && <small>建议补 {number(health.shortage)} {item.unit}</small>}</span><button onClick={() => openStock(stock)}>管理</button></div>)}</article>}

    {tab === "待审批" && <article className="panel approval-panel"><div className="panel-head"><div><h2>员工耗材申请</h2><p>审批通过后才会正式变更库存</p></div></div>{pending.map((entry) => { const item = consumables.find((current) => current.id === entry.consumableId); const service = services.find((current) => current.id === entry.serviceId); return <div className="approval-row" key={entry.id}><span className={`request-type type-${entry.type}`}>{entry.type}</span><div><strong>{entry.employeeName} · {item?.name}</strong><span>{service?.name ?? "未关联服务"} · {entry.createdAt}</span><p>{entry.reason}</p></div><b>{entry.quantity} {item?.unit}</b><div><button onClick={() => rejectRequest(entry.id, "陈妍")}>驳回</button><button className="approve" onClick={() => approveRequest(entry.id, "陈妍")}><Check size={14} />通过</button></div></div>; })}{!pending.length && <div className="inventory-empty"><ClipboardCheck size={28} /><strong>没有待审批申请</strong><span>员工提交额外领用、退回或报损后会显示在这里</span></div>}</article>}

    {tab === "库存流水" && <article className="panel ledger-panel"><div className="ledger-row ledger-head"><span>时间</span><span>耗材与门店</span><span>类型</span><span>员工/操作人</span><span>数量变化</span><span>状态</span></div>{scopedTransactions.map((entry) => { const item = consumables.find((current) => current.id === entry.consumableId); return <div className="ledger-row" key={entry.id}><span>{entry.createdAt}</span><span><strong>{item?.name}</strong><small>{stores.find((current) => current.id === entry.storeId)?.name}</small></span><span>{entry.type}</span><span>{entry.employeeName ?? entry.operator}</span><strong className={entry.change > 0 ? "positive" : "negative"}>{entry.change > 0 ? "+" : ""}{number(entry.change)} {item?.unit}</strong><span className={`transaction-status status-${entry.status}`}>{entry.status}</span></div>; })}</article>}

    {tab === "异常分析" && <article className="panel anomaly-panel"><div className="anomaly-note"><ShieldAlert size={20} /><div><strong>异常仅用于辅助核实</strong><p>系统根据额外领用量、报损和未关联服务单等信号提示，不直接认定员工违规。</p></div></div>{anomalies.map((entry) => { const item = consumables.find((current) => current.id === entry.consumableId); return <div className="anomaly-row" key={entry.id}><span><AlertTriangle size={17} /></span><div><strong>{entry.employeeName} · {entry.type} {entry.quantity} {item?.unit}</strong><small>{item?.name} · {stores.find((current) => current.id === entry.storeId)?.name} · {entry.createdAt}</small><p>{entry.reason ?? "未填写原因"}</p></div><i>{entry.appointmentId ? "用量偏高" : "未关联服务单"}</i></div>; })}{!anomalies.length && <div className="inventory-empty"><Check size={28} /><strong>暂未发现异常信号</strong></div>}</article>}

    {editing && <><button className="commerce-scrim" onClick={() => setEditing(null)} aria-label="关闭" /><aside className="commerce-drawer"><div className="drawer-head"><div><span>STOCK SETTING</span><h2>{consumables.find((item) => item.id === editing.consumableId)?.name}</h2><p>{stores.find((item) => item.id === editing.storeId)?.name}</p></div><button onClick={() => setEditing(null)}><X size={19} /></button></div><div className="stock-current"><span>当前库存</span><strong>{number(editing.quantity)} {consumables.find((item) => item.id === editing.consumableId)?.unit}</strong></div><div className="drawer-form"><label><span>本次入库数量</span><input type="number" min="0" value={incoming} onChange={(event) => setIncoming(Number(event.target.value))} /></label><label><span>安全库存</span><input type="number" min="0" value={safetyStock} onChange={(event) => setSafetyStock(Number(event.target.value))} /></label></div><p className="stock-tip">低于安全库存时店长会收到提醒；老板可在全部门店视图查看汇总。</p><button className="drawer-primary drawer-submit" onClick={saveStock}><Check size={17} />保存库存设置</button></aside></>}
  </>;
}
