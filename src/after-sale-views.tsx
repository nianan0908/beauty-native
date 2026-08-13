import { useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronRight, CircleAlert, Clock3, FileCheck2, RotateCcw, Search, ShieldCheck, WalletCards, X } from "lucide-react";
import { demoUsers } from "./data";
import { DEMO_CONTEXT } from "./demo-context";
import { useAfterSales, useCommerce, useMerchantScope } from "./store";
import type { AfterSaleResolution, AfterSaleStatus, AfterSaleType, Role } from "./types";

const types: AfterSaleType[] = ["退款申请", "服务不满意", "重新服务", "次卡核销异常", "预约取消退款", "其他问题"];
const resolutions: AfterSaleResolution[] = ["退款", "重新服务", "恢复卡次", "其他补偿"];
const currency = (value: number) => `¥${value.toLocaleString("zh-CN")}`;

function AfterSaleBadge({ status }: { status: AfterSaleStatus }) {
  return <span className={`after-sale-status after-sale-${status}`}>{status}</span>;
}

export function CustomerAfterSales({ onBack }: { onBack: () => void }) {
  const orders = useCommerce((state) => state.orders).filter((order) => order.customerId === DEMO_CONTEXT.customerId && order.status === "已完成");
  const afterSales = useAfterSales((state) => state.afterSales).filter((item) => item.customerId === DEMO_CONTEXT.customerId);
  const createAfterSale = useAfterSales((state) => state.createAfterSale);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [type, setType] = useState<AfterSaleType>("服务不满意");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [selectedAfterSaleId, setSelectedAfterSaleId] = useState<string | null>(null);
  const customer = useCommerce((state) => state.customers).find((item) => item.id === DEMO_CONTEXT.customerId);
  const selectedOrder = orders.find((order) => order.id === orderId);
  const selectedAfterSale = afterSales.find((item) => item.id === selectedAfterSaleId);
  const activeOrderIds = new Set(afterSales.filter((item) => !["已完成", "已驳回"].includes(item.status)).map((item) => item.orderId));

  const submit = () => {
    if (!selectedOrder || !reason.trim()) {
      setError("请说明需要门店处理的问题。");
      return;
    }
    const result = createAfterSale({ orderId: selectedOrder.id, type, reason, contact: customer?.phone ?? "" });
    if (!result) {
      setError("该订单已有处理中售后，或暂不支持申请。");
      return;
    }
    setOrderId(null);
    setReason("");
    setError("");
  };

  return <div className="customer-app customer-after-sale-app">
    <header className="message-header"><button onClick={onBack} aria-label="返回"><ArrowLeft size={19} /></button><h1>售后服务</h1><span /></header>
    <section className="customer-after-sale-intro"><span><ShieldCheck size={20} /></span><div><strong>栖光售后保障</strong><p>提交后门店会尽快联系你，处理进度可在这里查看。</p></div></section>
    <div className="customer-section-title"><strong>可申请订单</strong><span>{orders.length} 笔</span></div>
    <section className="customer-after-sale-orders">{orders.map((order) => {
      const disabled = activeOrderIds.has(order.id);
      return <article key={order.id}><span><WalletCards size={18} /></span><div><strong>{order.service}</strong><small>{order.createdAt.slice(0, 10)} · {order.store}</small></div><div><b>{currency(order.payable)}</b><button disabled={disabled} onClick={() => { setOrderId(order.id); setType(order.paymentMethod === "次卡" ? "次卡核销异常" : "服务不满意"); }}>{disabled ? "处理中" : "申请售后"}</button></div></article>;
    })}</section>
    <div className="customer-section-title"><strong>售后记录</strong><span>{afterSales.length} 条</span></div>
    <section className="customer-after-sale-records">{afterSales.length ? afterSales.map((item) => <button className="customer-after-sale-entry" key={item.id} onClick={() => setSelectedAfterSaleId(item.id)}><div><span>{item.type}</span><AfterSaleBadge status={item.status} /></div><h2>{item.service}</h2><p>{item.reason}</p><footer><small>{item.id} · {item.updatedAt}</small><ChevronRight size={15} /></footer></button>) : <div className="customer-after-sale-empty"><FileCheck2 size={26} /><strong>暂无售后记录</strong><span>需要帮助时可从已完成订单发起</span></div>}</section>
    {selectedOrder && <><button className="commerce-scrim" aria-label="关闭申请售后" onClick={() => setOrderId(null)} /><aside className="customer-after-sale-sheet"><div className="drawer-head"><div><span>AFTER-SALE REQUEST</span><h2>申请售后</h2><p>{selectedOrder.service} · {selectedOrder.id}</p></div><button aria-label="关闭" onClick={() => setOrderId(null)}><X size={19} /></button></div><div className="drawer-form"><label><span>问题类型</span><select value={type} onChange={(event) => { setType(event.target.value as AfterSaleType); setError(""); }}>{types.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>问题说明</span><textarea value={reason} maxLength={300} onChange={(event) => { setReason(event.target.value); setError(""); }} placeholder="请描述服务情况和希望的处理方式" /></label><label><span>联系电话</span><input value={customer?.phone ?? ""} disabled /></label></div>{error && <p className="after-sale-form-error">{error}</p>}<button className="drawer-primary" disabled={!reason.trim()} onClick={submit}><Check size={17} />提交售后申请</button></aside></>}
    {selectedAfterSale && <><button className="commerce-scrim" aria-label="关闭售后详情" onClick={() => setSelectedAfterSaleId(null)} /><aside className="customer-after-sale-sheet"><div className="drawer-head"><div><span>AFTER-SALE {selectedAfterSale.id}</span><h2>处理进度</h2><p>{selectedAfterSale.service}</p></div><button aria-label="关闭" onClick={() => setSelectedAfterSaleId(null)}><X size={19} /></button></div><div className="after-sale-detail-head"><div><span>{selectedAfterSale.customer.slice(0, 1)}</span><div><strong>{selectedAfterSale.type}</strong><small>提交于 {selectedAfterSale.createdAt}</small></div></div><AfterSaleBadge status={selectedAfterSale.status} /></div><section className="after-sale-reason"><span>问题说明</span><p>{selectedAfterSale.reason}</p>{selectedAfterSale.resolution && <small>处理方案：{selectedAfterSale.resolution}{selectedAfterSale.approvedAmount ? ` · ${currency(selectedAfterSale.approvedAmount)}` : ""}</small>}</section><section className="after-sale-timeline"><h3>处理记录</h3>{[...selectedAfterSale.logs].reverse().map((log) => <div key={log.id}><i /><span><strong>{log.action}</strong><small>{log.actor} · {log.createdAt}</small>{log.note && <p>{log.note}</p>}</span></div>)}</section></aside></>}
  </div>;
}

export function AfterSaleCenter({ role }: { role: Role }) {
  const afterSales = useAfterSales((state) => state.afterSales);
  const receiveAfterSale = useAfterSales((state) => state.receiveAfterSale);
  const submitProposal = useAfterSales((state) => state.submitAfterSaleProposal);
  const approveAfterSale = useAfterSales((state) => state.approveAfterSale);
  const completeAfterSale = useAfterSales((state) => state.completeAfterSale);
  const selectedStoreId = useMerchantScope((state) => state.selectedStoreId);
  const [status, setStatus] = useState<AfterSaleStatus | "全部">("全部");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resolution, setResolution] = useState<AfterSaleResolution>("重新服务");
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");
  const user = demoUsers.find((item) => item.role === role)!;
  const operator = user.name;
  const scoped = useMemo(() => afterSales.filter((item) => (!selectedStoreId || item.storeId === selectedStoreId) && `${item.id}${item.orderId}${item.customer}${item.service}${item.contact}`.includes(query.trim())).filter((item) => status === "全部" || item.status === status), [afterSales, query, selectedStoreId, status]);
  const selected = afterSales.find((item) => item.id === selectedId && (!selectedStoreId || item.storeId === selectedStoreId)) ?? null;
  const pendingStatuses: AfterSaleStatus[] = ["待受理", "处理中", "待审批", "待退款", "待重做", "待补偿"];

  const open = (id: string) => {
    const item = afterSales.find((afterSale) => afterSale.id === id);
    setSelectedId(id);
    setResolution(item?.resolution ?? (item?.type === "退款申请" ? "退款" : item?.type === "次卡核销异常" ? "恢复卡次" : "重新服务"));
    setAmount(item?.approvedAmount ?? item?.requestedAmount ?? 0);
    setNote("");
  };

  const propose = () => {
    if (selected && submitProposal(selected.id, operator, resolution, amount, note)) setNote("");
  };
  const approve = (approved: boolean) => {
    if (selected && approveAfterSale(selected.id, operator, approved, note)) setNote("");
  };
  const complete = () => {
    if (selected && completeAfterSale(selected.id, operator, note)) setNote("");
  };

  return <>
    <div className="page-heading"><div><span className="date-line">AFTER-SALE SERVICE</span><h1>{role === "receptionist" ? "售后处理" : "售后管理"}</h1><p>{role === "receptionist" ? "受理顾客问题、记录沟通并提交处理方案。" : role === "manager" ? "审批退款与重做方案，跟进门店售后闭环。" : "查看各门店售后进度、退款和问题分布。"}</p></div></div>
    <section className="after-sale-metrics"><article><span><CircleAlert size={19} /></span><div><small>待处理</small><strong>{afterSales.filter((item) => pendingStatuses.includes(item.status) && (!selectedStoreId || item.storeId === selectedStoreId)).length}</strong></div></article><article><span><Clock3 size={19} /></span><div><small>待审批</small><strong>{afterSales.filter((item) => item.status === "待审批" && (!selectedStoreId || item.storeId === selectedStoreId)).length}</strong></div></article><article><span><RotateCcw size={19} /></span><div><small>本月退款</small><strong>{currency(afterSales.filter((item) => item.status === "已完成" && item.resolution === "退款").reduce((sum, item) => sum + (item.approvedAmount ?? 0), 0))}</strong></div></article></section>
    <article className="panel after-sale-panel"><div className="after-sale-toolbar"><div className="status-filter">{(["全部", "待受理", "处理中", "待审批", "待退款", "待重做", "待补偿", "已完成", "已驳回"] as const).map((item) => <button className={status === item ? "active" : ""} key={item} onClick={() => setStatus(item)}>{item}</button>)}</div><div className="inline-search compact"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索售后单、订单或会员" /></div></div><div className="after-sale-row after-sale-head"><span>售后单与问题</span><span>会员</span><span>申请金额</span><span>处理人</span><span>状态</span><span /></div>{scoped.map((item) => <button className="after-sale-row" key={item.id} onClick={() => open(item.id)}><span><strong>{item.type} · {item.service}</strong><small>{item.id} · 订单 {item.orderId}</small></span><span><strong>{item.customer}</strong><small>{item.contact}</small></span><strong>{currency(item.requestedAmount)}</strong><span>{item.handler ?? "待分配"}</span><AfterSaleBadge status={item.status} /><ChevronRight size={16} /></button>)}{!scoped.length && <div className="after-sale-empty"><FileCheck2 size={28} /><strong>没有符合条件的售后单</strong><span>可调整状态或搜索条件</span></div>}</article>
    {selected && <><button className="commerce-scrim" aria-label="关闭售后详情" onClick={() => setSelectedId(null)} /><aside className="commerce-drawer after-sale-drawer"><div className="drawer-head"><div><span>AFTER-SALE {selected.id}</span><h2>{selected.type}</h2><p>订单 {selected.orderId} · {selected.customer}</p></div><button aria-label="关闭" onClick={() => setSelectedId(null)}><X size={19} /></button></div><div className="after-sale-detail-head"><div><span>{selected.customer.slice(0, 1)}</span><div><strong>{selected.customer}</strong><small>{selected.contact} · {selected.service}</small></div></div><AfterSaleBadge status={selected.status} /></div><section className="after-sale-reason"><span>顾客诉求</span><p>{selected.reason}</p><small>申请金额 {currency(selected.requestedAmount)} · {selected.createdAt}</small></section>{selected.resolution && <section className="after-sale-resolution"><span>当前处理方案</span><strong>{selected.resolution}{selected.resolution === "退款" ? ` ${currency(selected.approvedAmount ?? 0)}` : ""}</strong></section>}<section className="after-sale-timeline"><h3>处理记录</h3>{[...selected.logs].reverse().map((log) => <div key={log.id}><i /><span><strong>{log.action}</strong><small>{log.actor} · {log.createdAt}</small>{log.note && <p>{log.note}</p>}</span></div>)}</section>{selected.status === "待受理" && role !== "owner" && <button className="drawer-primary" onClick={() => receiveAfterSale(selected.id, operator)}><Check size={17} />受理售后</button>}{selected.status === "处理中" && role !== "owner" && <section className="after-sale-action-form"><label><span>处理方案</span><select value={resolution} onChange={(event) => setResolution(event.target.value as AfterSaleResolution)}>{resolutions.map((item) => <option key={item}>{item}</option>)}</select></label>{resolution === "退款" && <label><span>建议退款金额</span><input type="number" min="0" max={selected.requestedAmount} value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></label>}<label><span>处理说明</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="记录沟通结果和建议方案" /></label><button className="drawer-primary" disabled={!note.trim()} onClick={propose}><FileCheck2 size={17} />提交店长审批</button></section>}{selected.status === "待审批" && role !== "receptionist" && <section className="after-sale-action-form"><label><span>审批备注</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="填写审批意见（选填）" /></label><div className="after-sale-approval-actions"><button onClick={() => approve(false)}>驳回申请</button><button onClick={() => approve(true)}><Check size={16} />审批通过</button></div></section>}{["待退款", "待重做", "待补偿"].includes(selected.status) && role !== "owner" && <section className="after-sale-action-form"><label><span>完成说明</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="记录退款、重做预约或补偿结果" /></label><button className="drawer-primary" onClick={complete}><Check size={17} />确认完成售后</button></section>}</aside></>}
  </>;
}
