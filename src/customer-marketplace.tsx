import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Bell, CalendarDays, Check, ChevronRight, Clock3, Gift, MapPin, Phone, Sparkles, Star, Timer, UserRound, WalletCards, X } from "lucide-react";
import { marketplaceStores } from "./data";
import { DEMO_CONTEXT } from "./demo-context";
import { useAppointments, useCustomerContext, useCustomerMarketing, useOperations } from "./store";
import { bestCoupon, couponDiscount } from "./marketing-utils";
import type { BookingOffer, MarketingActivity, MarketplaceStore } from "./types";

interface CustomerMarketplaceProps {
  selectedStore: MarketplaceStore | null;
  onSelectStore: (store: MarketplaceStore | null) => void;
  onBook: (store: MarketplaceStore, offer?: BookingOffer) => void;
  onNavigate: (page: string) => void;
}

const activityDateText = (activity: MarketingActivity) => `${activity.startAt.slice(5).replace("-", "月")}日 - ${activity.endAt.slice(5).replace("-", "月")}日`;

export function CustomerMarketplace({ selectedStore, onSelectStore, onBook, onNavigate }: CustomerMarketplaceProps) {
  const allAppointments = useAppointments((state) => state.appointments);
  const currentStoreId = useCustomerContext((state) => state.storeId);
  const setCurrentStoreId = useCustomerContext((state) => state.setStoreId);
  const coupons = useCustomerMarketing((state) => state.coupons);
  const services = useOperations((state) => state.services);
  const brandActivities = useOperations((state) => state.activities);
  const operationStores = useOperations((state) => state.stores);
  const operationStaff = useOperations((state) => state.staff);
  const claimedCouponIds = useCustomerMarketing((state) => state.claimedCouponIds);
  const usedCouponIds = useCustomerMarketing((state) => state.usedCouponIds);
  const couponLocks = useCustomerMarketing((state) => state.couponLocks);
  const messages = useCustomerMarketing((state) => state.messages);
  const [activity, setActivity] = useState<MarketingActivity | null>(null);
  const [storePicker, setStorePicker] = useState(false);
  const [countdown, setCountdown] = useState(2 * 60 * 60 + 36 * 60 + 18);
  useEffect(() => {
    const timer = window.setInterval(() => setCountdown((value) => value > 0 ? value - 1 : 0), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const brandStores = operationStores.map((store, index) => {
    const marketplaceStore = marketplaceStores.find((item) => item.id === store.id);
    return {
      ...(marketplaceStore ?? marketplaceStores[0]),
      id: store.id,
      merchantId: store.merchantId,
      merchantName: "栖光美学",
      name: store.name,
      category: marketplaceStore?.category ?? "综合护理",
      rating: marketplaceStore?.rating ?? 5,
      reviewCount: marketplaceStore?.reviewCount ?? 0,
      distance: marketplaceStore?.distance ?? index * 1.8 + 0.8,
      address: store.address,
      businessHours: store.businessHours,
      status: store.status,
      tags: marketplaceStore?.tags ?? ["品牌门店", "专业护理"],
      serviceIds: services.filter((item) => item.storeIds?.includes(store.id)).map((item) => item.id),
      employeeIds: operationStaff.filter((item) => item.storeId === store.id && item.status === "在职").map((item) => item.id),
      promotion: marketplaceStore?.promotion,
    };
  });
  const currentStore = brandStores.find((store) => store.id === currentStoreId) ?? brandStores[0];
  const next = useMemo(() => [...allAppointments]
    .filter((item) => item.customerId === DEMO_CONTEXT.customerId && item.storeId === currentStore.id && !["已完成", "已取消", "未到店"].includes(item.status))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0], [allAppointments, currentStore.id, currentStore.name]);
  const currentServices = services.filter((service) => service.merchantId === DEMO_CONTEXT.merchantId && service.storeIds?.includes(currentStore.id) && service.isOnline && service.bookingEnabled);
  const currentActivities = brandActivities.filter((item) => item.storeId === currentStore.id && ["进行中", "未开始"].includes(item.status));
  const flashActivity = currentActivities.find((item) => item.type === "秒杀");
  const regularActivities = currentActivities.filter((item) => item.type !== "秒杀");
  const availableCoupons = coupons.filter((coupon) => claimedCouponIds.includes(coupon.id) && !usedCouponIds.includes(coupon.id) && !couponLocks[coupon.id]);
  const unreadCount = messages.filter((message) => !message.read).length;

  if (selectedStore) {
    return <StoreDetail store={selectedStore} onBack={() => onSelectStore(null)} onBook={(offer) => onBook(selectedStore, offer)} />;
  }

  return (
    <div className="customer-app private-home-app">
      <header className="private-brand-head">
        <div><span className="private-brand-mark">栖</span><span><strong>栖光美学</strong><small>你的专属护理空间</small></span></div>
        <button className="brand-message-button" aria-label={`消息${unreadCount ? `，${unreadCount}条未读` : ""}`} onClick={() => onNavigate("消息")}><Bell size={19} />{unreadCount > 0 && <i>{unreadCount}</i>}</button>
      </header>

      <button className="current-store-switch" onClick={() => setStorePicker(true)}><MapPin size={16} /><span><small>当前门店</small><strong>{currentStore.name}</strong></span><em>{currentStore.distance}km</em><ChevronRight size={16} /></button>

      <section className="private-brand-hero">
        <img src={currentStore.coverImage} alt="栖光美学护理环境" />
        <div><span>QIGUANG BEAUTY</span><h1>让每一次护理<br />都更懂你的肌肤</h1><p>{currentStore.name} · 专业护理</p><button onClick={() => onSelectStore(currentStore)}>查看门店<ArrowRight size={16} /></button></div>
      </section>

      <section className="private-quick-actions">
        <button disabled={currentStore.status === "暂停营业"} onClick={() => onBook(currentStore)}><span><CalendarDays size={19} /></span><strong>{currentStore.status === "暂停营业" ? "暂停预约" : "预约服务"}</strong></button>
        <button onClick={() => onNavigate("权益")}><span><WalletCards size={19} /></span><strong>我的卡项</strong></button>
        <button onClick={() => onNavigate("权益")}><span><Gift size={19} /></span><strong>会员权益</strong></button>
        <button onClick={() => window.alert(`${currentStore.name}\n联系电话：${operationStores.find((store) => store.id === currentStore.id)?.phone ?? "请到店咨询"}\n营业时间：${currentStore.businessHours}`)}><span><Phone size={19} /></span><strong>联系门店</strong></button>
      </section>

      {next && <button className="next-booking-strip private-next-booking" onClick={() => onNavigate("预约")}>
        <span><Clock3 size={17} /></span><div><small>下一次预约 · {next.store}</small><strong>{Number(next.date.slice(5, 7))}月{Number(next.date.slice(8))}日 {next.time} · {next.service}</strong></div><ChevronRight size={17} />
      </button>}

      <button className="private-member-offer" onClick={() => onNavigate("权益")}><span><Gift size={19} /></span><div><small>会员专享礼遇</small><strong>领取护理满减券</strong><p>栖光会员优惠券、积分和卡项两店通用</p></div><ChevronRight size={17} /></button>

      {currentStore.status === "暂停营业" && <section className="customer-store-paused"><Clock3 size={17} /><div><strong>门店暂停营业</strong><span>当前可浏览服务与权益，恢复营业后可提交预约。</span></div></section>}

      <section className="private-home-section activity-section">
        <div className="section-title"><h2>门店活动</h2><span>{currentStore.name}专享</span></div>
        {flashActivity && <button className="flash-sale-card" onClick={() => setActivity(flashActivity)}>
          <div className="flash-sale-head"><span><Timer size={14} />限时秒杀</span><div>距结束 <b>{formatCountdown(countdown)}</b></div></div>
          <div className="flash-sale-body"><span className="flash-sale-icon"><Sparkles size={24} /></span><div><small>{flashActivity.subtitle}</small><strong>{flashActivity.title}</strong><p><b>¥{flashActivity.price}</b><del>¥{flashActivity.originalPrice}</del><em>仅剩 {flashActivity.stock ?? 0} 份</em></p></div><i>马上抢</i></div>
        </button>}
        <div className="seasonal-activity-grid">{regularActivities.map((item) => <button key={item.id} onClick={() => setActivity(item)}><img src={item.coverImage} alt={item.title} /><div><span>{item.type}</span><strong>{item.title}</strong><small>{item.subtitle}</small><p>¥{item.price}<del>¥{item.originalPrice}</del></p></div></button>)}</div>
      </section>

      <section className="private-home-section">
        <div className="section-title"><h2>热门服务</h2><button onClick={() => onSelectStore(currentStore)}>全部服务</button></div>
        <div className="service-scroll">{currentServices.map((service) => { const coupon = bestCoupon(availableCoupons, service.id, currentStore.id, service.price); const finalPrice = coupon ? service.price - couponDiscount(coupon, service.price) : service.price; return <button disabled={currentStore.status === "暂停营业"} className="service-card private-service-card" key={service.id} onClick={() => onBook(currentStore, { serviceId: service.id, price: service.price })}><div className={`service-visual ${service.tone}`}><Sparkles size={25} /></div><span>{service.category}{coupon && <em>{coupon.label}</em>}</span><h3>{service.name}</h3><div><small>{service.duration} 分钟{coupon && <del>¥{service.price}</del>}</small><strong>{currentStore.status === "暂停营业" ? "暂停预约" : `${coupon ? "券后 " : ""}¥${finalPrice}`}</strong></div></button>; })}</div>
      </section>

      <section className="private-home-section">
        <div className="section-title"><h2>选择门店</h2><span>{brandStores.length} 家门店</span></div>
        <div className="private-store-list">{brandStores.map((store) => <PrivateStoreCard key={store.id} store={store} selected={store.id === currentStore.id} onOpen={() => { setCurrentStoreId(store.id); onSelectStore(store); }} onBook={() => { setCurrentStoreId(store.id); onBook(store); }} />)}</div>
      </section>
      {activity && <><button className="activity-scrim" aria-label="关闭活动详情" onClick={() => setActivity(null)} /><aside className="activity-drawer">
        <div className="activity-drawer-head"><div><span>{activity.type}</span><h2>{activity.title}</h2><p>{activityDateText(activity)}</p></div><button onClick={() => setActivity(null)} aria-label="关闭"><X size={19} /></button></div>
        {activity.coverImage ? <img className="activity-detail-image" src={activity.coverImage} alt={activity.title} /> : <div className="activity-detail-visual"><Timer size={32} /><span>距本场结束</span><strong>{formatCountdown(countdown)}</strong></div>}
        <div className="activity-price"><div><small>活动价</small><strong>¥{activity.price}</strong><del>¥{activity.originalPrice}</del></div>{activity.stock && <span>仅剩 {activity.stock} 份</span>}</div>
        <section className="activity-detail-copy"><h3>活动说明</h3>{activity.detail.map((line) => <p key={line}><Check size={14} />{line}</p>)}</section>
        <div className="activity-store"><MapPin size={17} /><div><small>适用门店</small><strong>{brandStores.find((store) => store.id === activity.storeId)?.name}</strong></div></div>
        <button className="activity-primary" onClick={() => { const store = brandStores.find((item) => item.id === activity.storeId) ?? currentStore; const offer = { activityId: activity.id, title: activity.title, serviceId: activity.serviceId, price: activity.price }; setActivity(null); onBook(store, offer); }}>立即预约<ArrowRight size={17} /></button>
      </aside></>}
      {storePicker && <><button className="activity-scrim" aria-label="关闭门店选择" onClick={() => setStorePicker(false)} /><aside className="store-picker-sheet"><div className="activity-drawer-head"><div><span>SELECT STORE</span><h2>选择服务门店</h2><p>服务、活动和可约时间将随门店更新</p></div><button onClick={() => setStorePicker(false)} aria-label="关闭"><X size={19} /></button></div><div>{brandStores.map((store) => <button className={store.id === currentStore.id ? "selected" : ""} key={store.id} onClick={() => { setCurrentStoreId(store.id); setStorePicker(false); }}><img src={store.coverImage} alt="" /><span><strong>{store.name}</strong><small>{store.distance}km · {store.address.replace("上海市", "")}</small><em>{store.tags.slice(0, 2).join(" · ")}</em></span>{store.id === currentStore.id ? <Check size={17} /> : <ChevronRight size={17} />}</button>)}</div></aside></>}
    </div>
  );
}

function PrivateStoreCard({ store, selected, onOpen, onBook }: { store: MarketplaceStore; selected: boolean; onOpen: () => void; onBook: () => void }) {
  const paused = store.status === "暂停营业";
  return <article className={`private-store-card ${selected ? "selected" : ""} ${paused ? "paused" : ""}`}><button onClick={onOpen}><img src={store.coverImage} alt={`${store.name}环境`} /><div><span><Star size={11} fill="currentColor" />{store.rating}{selected && <em>当前门店</em>}{paused && <em>暂停营业</em>}</span><h3>{store.name}</h3><p><MapPin size={12} />{store.distance}km · {store.address.replace("上海市", "")}</p><small>{store.tags.slice(0, 2).join(" · ")}</small></div><ChevronRight size={17} /></button><div><span>营业时间 {store.businessHours}</span><button disabled={paused} onClick={onBook}>{paused ? "暂停预约" : "立即预约"}</button></div></article>;
}

function StoreDetail({ store, onBack, onBook }: { store: MarketplaceStore; onBack: () => void; onBook: (offer?: BookingOffer) => void }) {
  const services = useOperations((state) => state.services);
  const staff = useOperations((state) => state.staff);
  const coupons = useCustomerMarketing((state) => state.coupons);
  const claimedCouponIds = useCustomerMarketing((state) => state.claimedCouponIds);
  const usedCouponIds = useCustomerMarketing((state) => state.usedCouponIds);
  const couponLocks = useCustomerMarketing((state) => state.couponLocks);
  const availableCoupons = coupons.filter((coupon) => claimedCouponIds.includes(coupon.id) && !usedCouponIds.includes(coupon.id) && !couponLocks[coupon.id]);
  const storeServices = services.filter((service) => service.merchantId === store.merchantId && service.storeIds?.includes(store.id) && service.isOnline && service.bookingEnabled);
  const storeEmployees = staff.filter((employee) => employee.storeId === store.id && employee.status === "在职");
  return <div className="customer-app store-detail-app">
    <header className="store-detail-hero">
      <img src={store.coverImage} alt={`${store.merchantName}${store.name}`} />
      <button onClick={onBack} aria-label="返回发现"><ArrowLeft size={20} /></button>
      <div><span>{store.category}</span><h1>{store.merchantName}</h1><p>{store.name}</p></div>
    </header>

    <section className="store-detail-summary">
      <div><strong><Star size={15} fill="currentColor" />{store.rating}</strong><span>{store.reviewCount} 条真实评价</span></div>
      <div><strong>{store.distance}km</strong><span>距当前位置</span></div>
      <div><strong>{store.businessHours.split(" - ")[1]}</strong><span>今日闭店</span></div>
    </section>

    <section className="store-address-line"><MapPin size={18} /><div><strong>{store.address}</strong><span>营业时间 {store.businessHours}</span></div><ChevronRight size={17} /></section>
    {store.promotion && <section className="store-promotion"><Sparkles size={17} /><span><small>到店优惠</small><strong>{store.promotion}</strong></span></section>}

    <section className="store-detail-section"><div className="section-title"><h2>可预约服务</h2><span>{storeServices.length} 项</span></div><div className="store-service-list">{storeServices.map((service) => { const coupon = bestCoupon(availableCoupons, service.id, store.id, service.price); const finalPrice = coupon ? service.price - couponDiscount(coupon, service.price) : service.price; return <button key={service.id} onClick={() => onBook({ serviceId: service.id, price: service.price })}><span className={service.tone}><Sparkles size={19} /></span><div><small>{service.category}{coupon && <em>{coupon.label}</em>}</small><strong>{service.name}</strong><p>{service.duration} 分钟</p></div><b>{coupon && <del>¥{service.price}</del>}<strong>{coupon ? "券后 " : ""}¥{finalPrice}</strong></b></button>; })}</div></section>
    <section className="store-detail-section"><div className="section-title"><h2>服务团队</h2><span>{storeEmployees.length} 位可预约</span></div><div className="store-staff-list">{storeEmployees.map((employee) => <article key={employee.id}><span><UserRound size={20} /></span><div><strong>{employee.name}</strong><small>{employee.title}</small></div><b><Star size={11} fill="currentColor" />4.9</b></article>)}</div></section>

    <footer className="store-booking-footer"><div><small>{store.status === "暂停营业" ? "门店当前暂停营业" : "到店后付款"}</small><strong>{store.merchantName} · {store.name}</strong></div><button disabled={store.status === "暂停营业"} onClick={() => onBook()}>{store.status === "暂停营业" ? "暂停预约" : "立即预约"}<ArrowRight size={17} /></button></footer>
  </div>;
}

function formatCountdown(value: number) {
  const hours = String(Math.floor(value / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((value % 3600) / 60)).padStart(2, "0");
  const seconds = String(value % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}
