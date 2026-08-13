import type { MarketplaceStore, ServiceItem } from "./types";

export interface AdvisorRecommendation {
  service: ServiceItem;
  store: MarketplaceStore;
  reason: string;
  score: number;
}

interface RecommendationRule {
  serviceId: string;
  keywords: string[];
  reason: string;
}

const recommendationRules: RecommendationRule[] = [
  { serviceId: "S001", keywords: ["补水", "干燥", "缺水", "暗沉", "水光", "熬夜", "提亮", "面部"], reason: "更适合改善干燥、暗沉和熬夜后的倦容" },
  { serviceId: "S004", keywords: ["毛孔", "黑头", "出油", "清洁", "闭口", "粗糙", "痘", "油皮"], reason: "针对毛孔、出油和清洁需求更匹配" },
  { serviceId: "S002", keywords: ["肩颈", "酸痛", "僵硬", "疲劳", "久坐", "放松", "压力", "睡不好"], reason: "适合久坐疲劳、肩颈紧绷和放松需求" },
  { serviceId: "S003", keywords: ["手部", "手干", "手膜", "手护理", "指缘", "倒刺", "手"], reason: "适合手部干燥、指缘粗糙和日常养护" },
];

export function recommendServices(input: string, services: ServiceItem[], stores: MarketplaceStore[], currentStoreId: string) {
  const normalized = input.trim().toLowerCase();
  const results = recommendationRules.flatMap((rule) => {
    const service = services.find((item) => item.id === rule.serviceId && item.isOnline && item.bookingEnabled);
    if (!service) return [];
    const keywordScore = rule.keywords.reduce((score, keyword) => score + (normalized.includes(keyword) ? Math.max(2, keyword.length) : 0), 0);
    const matchingStores = stores.filter((store) => service.storeIds?.includes(store.id));
    const store = matchingStores.find((item) => item.id === currentStoreId) ?? matchingStores[0];
    if (!store) return [];
    const historyBoost = service.id === "S002" ? 1 : 0;
    const storeBoost = store.id === currentStoreId ? 1 : 0;
    return [{ service, store, reason: rule.reason, score: keywordScore * 10 + historyBoost + storeBoost }];
  });

  const hasKeywordMatch = results.some((item) => item.score >= 20);
  return results
    .filter((item) => hasKeywordMatch ? item.score >= 20 : ["S002", "S001"].includes(item.service.id))
    .sort((left, right) => right.score - left.score)
    .slice(0, 2);
}

export function advisorReply(input: string, recommendations: AdvisorRecommendation[]) {
  const normalized = input.trim();
  if (!normalized) return "可以告诉我最近最想改善的问题，例如干燥暗沉、毛孔黑头、肩颈疲劳或手部干燥。";
  if (!recommendations.length) return "我还需要多了解一点。你更关注面部状态、身体放松，还是手部护理？";
  const names = recommendations.map((item) => item.service.name).join("和");
  return `结合你提到的情况，我更建议${names}。我已按匹配度、可预约门店和当前优惠整理在下面。`;
}
