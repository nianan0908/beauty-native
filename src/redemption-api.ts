import { authorizedFetch } from "./auth-api";

const apiOrigin = (import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1").replace(/\/$/, "");

export interface RedemptionActor {
  id: string;
  role: "employee";
  merchantId: string;
  storeId: string;
}

export interface RedemptionCardOption {
  id: string;
  name: string;
  remaining_times: number;
  expires_at: string;
}

export interface PendingRedemption {
  order_id: string;
  appointment_id?: string;
  customer_id: string;
  customer_name: string;
  service_id: string;
  service_name: string;
  employee_id: string;
  created_at: string;
  cards: RedemptionCardOption[];
}

export interface RedemptionRecord {
  id: string;
  order_id: string;
  appointment_id?: string;
  card_id: string;
  customer_id: string;
  service_id: string;
  employee_id: string;
  balance: number;
  source: string;
  created_at: string;
}

async function redemptionRequest<T>(path: string, _actor: RedemptionActor, init?: RequestInit): Promise<T> {
  const response = await authorizedFetch(`${apiOrigin}/redemptions${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null) as { message?: string; detail?: string } | null;
    throw new Error(error?.message ?? error?.detail ?? "次卡核销服务暂不可用");
  }
  return response.json() as Promise<T>;
}

export const redemptionApi = {
  listPending: (actor: RedemptionActor) => redemptionRequest<PendingRedemption[]>("/pending", actor),
  listHistory: (actor: RedemptionActor) => redemptionRequest<RedemptionRecord[]>("/history", actor),
  redeem: (actor: RedemptionActor, orderId: string, cardId: string) => redemptionRequest<RedemptionRecord>(`/orders/${encodeURIComponent(orderId)}`, actor, { method: "POST", body: JSON.stringify({ card_id: cardId }) }),
};
