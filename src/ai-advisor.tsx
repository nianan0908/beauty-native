import { useMemo, useState } from "react";
import { ArrowRight, Bot, BotMessageSquare, Check, ChevronRight, Clock3, MapPin, Send, Sparkles, X } from "lucide-react";
import { marketplaceStores } from "./data";
import { bestCoupon, couponDiscount } from "./marketing-utils";
import { useCustomerContext, useCustomerMarketing, useOperations } from "./store";
import { advisorReply, recommendServices, type AdvisorRecommendation } from "./ai-recommendation";
import { DEMO_CONTEXT } from "./demo-context";
import type { BookingOffer, MarketplaceStore } from "./types";

interface AdvisorMessage {
  id: string;
  role: "advisor" | "customer";
  text: string;
  recommendations?: AdvisorRecommendation[];
}

const quickQuestions = ["最近皮肤干燥暗沉", "毛孔黑头比较明显", "久坐肩颈很疲劳", "手部干燥有倒刺"];
export function AiAdvisor({ onBook, navigationItem = false }: { onBook: (store: MarketplaceStore, offer?: BookingOffer) => void; navigationItem?: boolean }) {
  const currentStoreId = useCustomerContext((state) => state.storeId);
  const coupons = useCustomerMarketing((state) => state.coupons);
  const claimedCouponIds = useCustomerMarketing((state) => state.claimedCouponIds);
  const usedCouponIds = useCustomerMarketing((state) => state.usedCouponIds);
  const couponLocks = useCustomerMarketing((state) => state.couponLocks);
  const brandServices = useOperations((state) => state.services).filter((service) => service.merchantId === DEMO_CONTEXT.merchantId);
  const operationStores = useOperations((state) => state.stores);
  const operationStaff = useOperations((state) => state.staff);
  const brandStores = operationStores.map((store) => {
    const marketplaceStore = marketplaceStores.find((item) => item.id === store.id);
    return {
      ...(marketplaceStore ?? marketplaceStores[0]),
      id: store.id,
      merchantId: store.merchantId,
      merchantName: "栖光美学",
      name: store.name,
      category: marketplaceStore?.category ?? "综合护理",
      address: store.address,
      businessHours: store.businessHours,
      serviceIds: brandServices.filter((item) => item.storeIds?.includes(store.id)).map((item) => item.id),
      employeeIds: operationStaff.filter((item) => item.storeId === store.id && item.status === "在职").map((item) => item.id),
    };
  });
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AdvisorMessage[]>([
    { id: "welcome", role: "advisor", text: "你好，我是栖光 AI 护理顾问。最近有什么想改善的状态？" },
  ]);
  const availableCoupons = useMemo(() => coupons.filter((coupon) => claimedCouponIds.includes(coupon.id) && !usedCouponIds.includes(coupon.id) && !couponLocks[coupon.id]), [claimedCouponIds, couponLocks, coupons, usedCouponIds]);

  const send = (value = input) => {
    const text = value.trim();
    if (!text) return;
    const recommendations = recommendServices(text, brandServices, brandStores, currentStoreId);
    setMessages((current) => [
      ...current,
      { id: `customer-${Date.now()}`, role: "customer", text },
      { id: `advisor-${Date.now()}`, role: "advisor", text: advisorReply(text, recommendations), recommendations },
    ]);
    setInput("");
  };

  return <>
    <button className={navigationItem ? `ai-advisor-tab ${open ? "active" : ""}` : "ai-advisor-trigger"} onClick={() => setOpen(true)} aria-label="打开 AI 护理顾问" aria-expanded={open} title="AI 护理顾问"><i><BotMessageSquare size={navigationItem ? 21 : 16} /></i>{navigationItem && <span>AI 顾问</span>}</button>
    {open && <><button className="ai-advisor-scrim" onClick={() => setOpen(false)} aria-label="关闭 AI 护理顾问" /><aside className="ai-advisor-sheet">
      <header className="ai-advisor-head"><span><Bot size={20} /></span><div><strong>栖光 AI 护理顾问</strong><small><i />在线为你推荐</small></div><button onClick={() => setOpen(false)} aria-label="关闭"><X size={19} /></button></header>
      <div className="ai-advisor-context"><MapPin size={14} /><span>优先推荐 {brandStores.find((store) => store.id === currentStoreId)?.name}</span><em>可切换同品牌门店</em></div>
      <section className="ai-message-list">
        {messages.map((message) => <div className={`ai-message ${message.role}`} key={message.id}>{message.role === "advisor" && <span><Sparkles size={15} /></span>}<div><p>{message.text}</p>{message.recommendations?.map((recommendation) => {
          const coupon = bestCoupon(availableCoupons, recommendation.service.id, recommendation.store.id, recommendation.service.price);
          const price = coupon ? recommendation.service.price - couponDiscount(coupon, recommendation.service.price) : recommendation.service.price;
          return <article className="ai-recommendation-card" key={`${message.id}-${recommendation.service.id}`}><div className={`ai-service-icon ${recommendation.service.tone}`}><Sparkles size={19} /></div><div className="ai-service-copy"><span>{recommendation.service.category}{coupon && <em>{coupon.label}</em>}</span><strong>{recommendation.service.name}</strong><p>{recommendation.reason}</p><small><MapPin size={12} />{recommendation.store.name}<Clock3 size={12} />{recommendation.service.duration} 分钟</small></div><div className="ai-service-action"><b>{coupon && <del>¥{recommendation.service.price}</del>}¥{price}</b><button onClick={() => { setOpen(false); onBook(recommendation.store, { serviceId: recommendation.service.id, price: recommendation.service.price }); }}>预约<ChevronRight size={14} /></button></div></article>;
        })}</div></div>)}
      </section>
      {messages.length === 1 && <div className="ai-quick-questions">{quickQuestions.map((question) => <button key={question} onClick={() => send(question)}><Check size={13} />{question}<ArrowRight size={13} /></button>)}</div>}
      <p className="ai-advisor-note">护理建议仅供参考，如有持续不适请先咨询专业人员。</p>
      <footer className="ai-advisor-input"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") send(); }} placeholder="描述你的皮肤或身体状态" /><button disabled={!input.trim()} onClick={() => send()} aria-label="发送"><Send size={17} /></button></footer>
    </aside></>}
  </>;
}
