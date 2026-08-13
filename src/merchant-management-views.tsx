import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clipboard,
  Clock3,
  ExternalLink,
  Gift,
  MapPin,
  Megaphone,
  MoreHorizontal,
  Plus,
  QrCode,
  Search,
  Sparkles,
  Store,
  X,
} from "lucide-react";
import { DEMO_CONTEXT } from "./demo-context";
import { useInventory, useMerchantScope, useOperations } from "./store";
import { CardCenter } from "./commerce-views";
import type { MarketingActivity, ServiceItem } from "./types";

const currency = (value: number) => `¥${value.toLocaleString("zh-CN")}`;
const serviceTones = ["service-green", "service-coral", "service-blue", "service-gold"];

function emptyService(): ServiceItem {
  return {
    id: `S${Date.now()}`,
    merchantId: DEMO_CONTEXT.merchantId,
    storeIds: [],
    isOnline: true,
    bookingEnabled: true,
    category: "面部护理",
    name: "",
    duration: 60,
    price: 0,
    tone: serviceTones[0],
  };
}

export function ServiceManagement() {
  const [tab, setTab] = useState<"服务项目" | "次卡管理">("服务项目");
  const services = useOperations((state) => state.services);
  const stores = useOperations((state) => state.stores);
  const consumables = useInventory((state) => state.consumables);
  const saveService = useOperations((state) => state.saveService);
  const toggleServiceStatus = useOperations((state) => state.toggleServiceStatus);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<ServiceItem | null>(null);
  const selectedStoreId = useMerchantScope((state) => state.selectedStoreId);
  const merchantServices = services.filter((service) => service.merchantId === DEMO_CONTEXT.merchantId && (!selectedStoreId || service.storeIds?.includes(selectedStoreId)));
  const filtered = merchantServices.filter((service) => `${service.name}${service.category}`.includes(query));
  const onlineCount = merchantServices.filter((service) => service.isOnline).length;

  const submit = () => {
    if (!draft?.name.trim() || draft.price < 0 || draft.duration <= 0 || !draft.storeIds?.length) return;
    saveService({ ...draft, name: draft.name.trim() });
    setDraft(null);
  };

  if (tab === "次卡管理") return <><div className="management-tabs"><button onClick={() => setTab("服务项目")}>服务项目</button><button className="active">次卡管理</button></div><CardCenter /></>;

  return <>
    <div className="management-tabs"><button className="active">服务项目</button><button onClick={() => setTab("次卡管理")}>次卡管理</button></div>
    <div className="page-heading"><div><span className="date-line">SERVICE CATALOG</span><h1>服务项目</h1><p>维护服务价格、时长、适用门店和顾客端预约状态。</p></div><button className="primary-action" onClick={() => setDraft(emptyService())}><Plus size={17} /> 新增服务</button></div>
    <section className="catalog-metrics"><div><Sparkles size={19} /><span><strong>{merchantServices.length}</strong>全部项目</span></div><div><Check size={19} /><span><strong>{onlineCount}</strong>线上可见</span></div><div><CalendarDays size={19} /><span><strong>{merchantServices.filter((item) => item.bookingEnabled).length}</strong>开放预约</span></div></section>
    <article className="panel catalog-panel">
      <div className="catalog-toolbar"><div className="inline-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索服务名称或分类" /></div><span>顾客端仅展示已上架且开放预约的项目</span></div>
      <div className="service-manage-row service-manage-head"><span>服务项目</span><span>适用门店</span><span>时长</span><span>价格</span><span>状态</span><span /></div>
      {filtered.map((service) => <div className="service-manage-row" key={service.id}>
        <span><i className={service.tone}><Sparkles size={17} /></i><span><strong>{service.name}</strong><small>{service.category}</small></span></span>
        <span>{stores.filter((store) => service.storeIds?.includes(store.id)).map((store) => store.name).join("、") || "未设置"}</span>
        <span>{service.duration} 分钟</span><strong>{currency(service.price)}</strong>
        <button className={`state-toggle ${service.isOnline ? "active" : ""}`} onClick={() => toggleServiceStatus(service.id)}><i />{service.isOnline ? "已上架" : "已下架"}</button>
        <button className="icon-row-button" onClick={() => setDraft({ ...service, storeIds: [...(service.storeIds ?? [])] })}><MoreHorizontal size={17} /></button>
      </div>)}
    </article>
    {draft && <><button className="commerce-scrim" onClick={() => setDraft(null)} aria-label="关闭" /><aside className="commerce-drawer">
      <div className="drawer-head"><div><span>SERVICE SETTING</span><h2>{merchantServices.some((item) => item.id === draft.id) ? "编辑服务项目" : "新增服务项目"}</h2></div><button onClick={() => setDraft(null)}><X size={19} /></button></div>
      <div className="drawer-form">
        <label><span>服务名称</span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="例如：敏感肌修护护理" /></label>
        <label><span>服务分类</span><select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}><option>面部护理</option><option>皮肤管理</option><option>身体舒缓</option><option>手部护理</option><option>美甲美睫</option></select></label>
        <div className="form-pair"><label><span>服务价格</span><input type="number" min="0" value={draft.price} onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })} /></label><label><span>服务时长（分钟）</span><input type="number" min="15" step="15" value={draft.duration} onChange={(event) => setDraft({ ...draft, duration: Number(event.target.value) })} /></label></div>
        <fieldset className="choice-field"><legend>适用门店</legend>{stores.map((store) => <label key={store.id}><input type="checkbox" checked={draft.storeIds?.includes(store.id)} onChange={() => setDraft({ ...draft, storeIds: draft.storeIds?.includes(store.id) ? draft.storeIds.filter((id) => id !== store.id) : [...(draft.storeIds ?? []), store.id] })} /><span>{store.name}</span></label>)}</fieldset>
        <fieldset className="consumable-config"><legend>单次服务标准耗材</legend><p>服务完成时系统会按这里的用量自动出库。</p>{consumables.map((item) => { const usage = draft.consumables?.find((current) => current.consumableId === item.id); return <label key={item.id}><span><strong>{item.name}</strong><small>{item.category} · {item.unit}</small></span><input type="number" min="0" step="0.1" value={usage?.quantity ?? 0} onChange={(event) => { const quantity = Number(event.target.value); const rest = (draft.consumables ?? []).filter((current) => current.consumableId !== item.id); setDraft({ ...draft, consumables: quantity > 0 ? [...rest, { consumableId: item.id, quantity }] : rest }); }} /></label>; })}</fieldset>
        <fieldset className="choice-field"><legend>顾客端状态</legend><label><input type="checkbox" checked={draft.isOnline} onChange={(event) => setDraft({ ...draft, isOnline: event.target.checked })} /><span>上架展示</span></label><label><input type="checkbox" checked={draft.bookingEnabled} onChange={(event) => setDraft({ ...draft, bookingEnabled: event.target.checked })} /><span>允许预约</span></label></fieldset>
      </div>
      <button className="drawer-primary drawer-submit" disabled={!draft.name.trim() || !draft.storeIds?.length} onClick={submit}><Check size={17} /> 保存服务项目</button>
    </aside></>}
  </>;
}

function emptyActivity(service?: ServiceItem, storeId?: string): MarketingActivity {
  return {
    id: `ACT${Date.now()}`,
    merchantId: DEMO_CONTEXT.merchantId,
    type: "节日活动",
    title: "",
    subtitle: "",
    serviceId: service?.id ?? "",
    price: service?.price ?? 0,
    originalPrice: service?.price ?? 0,
    storeId: storeId ?? "",
    startAt: "2026-08-13",
    endAt: "2026-08-31",
    detail: [],
    status: "未开始",
  };
}

export function MarketingManagement() {
  const activities = useOperations((state) => state.activities);
  const services = useOperations((state) => state.services).filter((item) => item.merchantId === DEMO_CONTEXT.merchantId);
  const stores = useOperations((state) => state.stores);
  const saveActivity = useOperations((state) => state.saveActivity);
  const toggleActivityStatus = useOperations((state) => state.toggleActivityStatus);
  const [draft, setDraft] = useState<MarketingActivity | null>(null);
  const selectedStoreId = useMerchantScope((state) => state.selectedStoreId);
  const merchantActivities = activities.filter((activity) => activity.merchantId === DEMO_CONTEXT.merchantId && (!selectedStoreId || activity.storeId === selectedStoreId));

  const submit = () => {
    if (!draft?.title.trim() || !draft.serviceId || !draft.storeId || draft.price < 0) return;
    saveActivity({ ...draft, title: draft.title.trim(), detail: draft.detail.filter(Boolean) });
    setDraft(null);
  };

  return <>
    <div className="page-heading"><div><span className="date-line">MARKETING CAMPAIGNS</span><h1>营销活动</h1><p>配置秒杀、节日与会员活动，发布后同步展示在私域顾客端。</p></div><button className="primary-action" onClick={() => setDraft(emptyActivity(services.find((service) => !selectedStoreId || service.storeIds?.includes(selectedStoreId)), selectedStoreId ?? stores[0]?.id))}><Plus size={17} /> 新建活动</button></div>
    <section className="campaign-summary"><article><span><Megaphone size={20} /></span><div><small>进行中活动</small><strong>{merchantActivities.filter((item) => item.status === "进行中").length}</strong></div></article><article><span><Gift size={20} /></span><div><small>覆盖门店</small><strong>{new Set(merchantActivities.map((item) => item.storeId)).size}</strong></div></article><article><span><CalendarDays size={20} /></span><div><small>待开始活动</small><strong>{merchantActivities.filter((item) => item.status === "未开始").length}</strong></div></article></section>
    <section className="campaign-grid">{merchantActivities.map((activity) => {
      const service = services.find((item) => item.id === activity.serviceId);
      const store = stores.find((item) => item.id === activity.storeId);
      return <article className="campaign-card" key={activity.id}>
        <div className={`campaign-visual campaign-${activity.type}`}><span>{activity.type}</span>{activity.coverImage ? <img src={activity.coverImage} alt="" /> : <Megaphone size={32} />}</div>
        <div className="campaign-body"><div><span className={`campaign-status status-${activity.status}`}>{activity.status}</span><button onClick={() => setDraft({ ...activity, detail: [...activity.detail] })}><MoreHorizontal size={18} /></button></div><h2>{activity.title}</h2><p>{activity.subtitle}</p><dl><div><dt>活动项目</dt><dd>{service?.name}</dd></div><div><dt>适用门店</dt><dd>{store?.name}</dd></div><div><dt>活动时间</dt><dd>{activity.startAt.slice(5)} 至 {activity.endAt.slice(5)}</dd></div></dl><footer><span><strong>{currency(activity.price)}</strong><del>{currency(activity.originalPrice)}</del></span><button onClick={() => toggleActivityStatus(activity.id)}>{activity.status === "已停用" ? "重新启用" : "停止活动"}</button></footer></div>
      </article>;
    })}</section>
    {draft && <><button className="commerce-scrim" onClick={() => setDraft(null)} aria-label="关闭" /><aside className="commerce-drawer">
      <div className="drawer-head"><div><span>CAMPAIGN SETTING</span><h2>{merchantActivities.some((item) => item.id === draft.id) ? "编辑营销活动" : "新建营销活动"}</h2></div><button onClick={() => setDraft(null)}><X size={19} /></button></div>
      <div className="drawer-form">
        <label><span>活动名称</span><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="例如：秋季焕肤周" /></label>
        <label><span>活动副标题</span><input value={draft.subtitle} onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })} placeholder="一句话说明活动亮点" /></label>
        <div className="form-pair"><label><span>活动类型</span><select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as MarketingActivity["type"] })}><option>秒杀</option><option>节日活动</option><option>会员活动</option></select></label><label><span>发布状态</span><select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as MarketingActivity["status"] })}><option>进行中</option><option>未开始</option><option>已结束</option><option>已停用</option></select></label></div>
        <label><span>关联服务</span><select value={draft.serviceId} onChange={(event) => { const service = services.find((item) => item.id === event.target.value); setDraft({ ...draft, serviceId: event.target.value, originalPrice: service?.price ?? draft.originalPrice }); }}>{services.map((service) => <option value={service.id} key={service.id}>{service.name}</option>)}</select></label>
        <label><span>适用门店</span><select value={draft.storeId} onChange={(event) => setDraft({ ...draft, storeId: event.target.value })}>{stores.map((store) => <option value={store.id} key={store.id}>{store.name}</option>)}</select></label>
        <div className="form-pair"><label><span>活动价</span><input type="number" min="0" value={draft.price} onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })} /></label><label><span>活动库存</span><input type="number" min="0" value={draft.stock ?? 0} onChange={(event) => setDraft({ ...draft, stock: Number(event.target.value) || undefined })} /></label></div>
        <div className="form-pair"><label><span>开始日期</span><input type="date" value={draft.startAt} onChange={(event) => setDraft({ ...draft, startAt: event.target.value })} /></label><label><span>结束日期</span><input type="date" value={draft.endAt} onChange={(event) => setDraft({ ...draft, endAt: event.target.value })} /></label></div>
        <label><span>活动说明（每行一条）</span><textarea value={draft.detail.join("\n")} onChange={(event) => setDraft({ ...draft, detail: event.target.value.split("\n") })} /></label>
      </div>
      <button className="drawer-primary drawer-submit" disabled={!draft.title.trim() || !draft.serviceId || !draft.storeId} onClick={submit}><Check size={17} /> 保存营销活动</button>
    </aside></>}
  </>;
}

export function PrivateStoreCenter() {
  const stores = useOperations((state) => state.stores);
  const services = useOperations((state) => state.services).filter((item) => item.merchantId === DEMO_CONTEXT.merchantId && item.isOnline);
  const activities = useOperations((state) => state.activities).filter((item) => item.merchantId === DEMO_CONTEXT.merchantId && item.status !== "已停用" && item.status !== "已结束");
  const [copied, setCopied] = useState(false);
  const configuredOrigin = import.meta.env.VITE_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  const publicOrigin = configuredOrigin || window.location.origin;
  const shareUrl = `${publicOrigin}/?shop=qiguang&page=${encodeURIComponent("首页")}`;
  const isPublicHttps = shareUrl.startsWith("https://");
  const [qrUrl, setQrUrl] = useState("");
  const [qrError, setQrError] = useState(false);
  const storeNames = useMemo(() => stores.map((store) => store.name).join("、"), [stores]);
  useEffect(() => {
    let active = true;
    setQrError(false);
    QRCode.toDataURL(shareUrl, { width: 260, margin: 2, errorCorrectionLevel: "M", color: { dark: "#243b32", light: "#ffffff" } })
      .then((url) => { if (active) setQrUrl(url); })
      .catch(() => { if (active) setQrError(true); });
    return () => { active = false; };
  }, [shareUrl]);
  const copyLink = async () => {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(shareUrl);
    else {
      const input = document.createElement("textarea");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  const openQrCode = () => {
    if (!qrUrl) return;
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = "栖光美学-会员端二维码.png";
    link.click();
  };

  return <>
    <div className="page-heading"><div><span className="date-line">PRIVATE DOMAIN STORE</span><h1>私域店铺</h1><p>统一管理品牌会员访问入口，生成专属链接和手机扫码二维码。</p></div><button className="primary-action" onClick={() => window.open(shareUrl, "_blank", "noopener,noreferrer")}><ExternalLink size={17} /> 打开会员端</button></div>
    <section className="private-admin-layout">
      <article className="panel share-panel"><div className="panel-head"><div><h2>品牌会员访问入口</h2><p>可用于门店物料、微信群、朋友圈和员工分享</p></div><span className={`published-dot ${isPublicHttps ? "" : "local"}`}><i />{isPublicHttps ? "HTTPS 已就绪" : "本地预览"}</span></div><div className="share-entry"><div className={`demo-qr ${!qrUrl ? "loading" : ""}`}>{qrUrl ? <img src={qrUrl} alt="栖光美学品牌会员端二维码" /> : qrError ? <span>二维码生成失败</span> : <span>正在生成二维码…</span>}</div><div><span>栖光美学品牌会员端</span><strong>手机扫码进入会员端</strong><p>免登录直达首页，当前覆盖 {stores.length} 家门店：{storeNames}</p><div className="share-link"><input aria-label="顾客端专属链接" readOnly value={shareUrl} /><button onClick={copyLink}>{copied ? <Check size={16} /> : <Clipboard size={16} />}{copied ? "已复制" : "复制"}</button></div></div></div>{isPublicHttps ? <div className="share-deploy-state ready"><Check size={16} /><span><strong>可供手机扫码</strong><small>当前使用 HTTPS 正式地址，二维码可直接用于演示物料。</small></span></div> : <div className="share-deploy-state"><ExternalLink size={16} /><span><strong>部署后二维码才可跨设备访问</strong><small>当前链接是 {window.location.hostname}。部署 HTTPS 后会自动替换，或设置 VITE_PUBLIC_SITE_URL。</small></span></div>}<div className="share-actions"><button disabled={!qrUrl} onClick={openQrCode}><QrCode size={17} />下载二维码</button><button onClick={copyLink}><ArrowRight size={17} />复制会员链接</button></div></article>
      <article className="phone-preview"><header><span>栖光美学</span><i>···</i></header><div className="preview-store"><MapPin size={13} /><span>{stores[0]?.name}</span></div><div className="preview-hero"><Sparkles size={28} /><span>QIGUANG BEAUTY</span><strong>让每一次护理<br />都更懂你的肌肤</strong></div><div className="preview-actions"><span><CalendarDays size={16} />预约服务</span><span><Gift size={16} />会员权益</span><span><Store size={16} />选择门店</span></div><div className="preview-section"><div><strong>门店活动</strong><small>{activities.length} 个进行中</small></div>{activities.slice(0, 2).map((item) => <p key={item.id}><i>{item.type}</i><span>{item.title}</span><b>{currency(item.price)}</b></p>)}</div><div className="preview-section"><div><strong>热门服务</strong><small>{services.length} 个已上架</small></div>{services.slice(0, 2).map((item) => <p key={item.id}><i><Clock3 size={11} /></i><span>{item.name}</span><b>{currency(item.price)}</b></p>)}</div></article>
    </section>
  </>;
}
