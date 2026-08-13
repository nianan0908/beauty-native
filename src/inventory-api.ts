import type { ConsumableTransaction } from "./types";
import { authorizedFetch } from "./auth-api";

const apiOrigin = (import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1").replace(/\/$/, "");

export interface InventoryActor {
  id: string;
  role: "owner" | "manager" | "employee";
  merchantId: string;
  storeId?: string;
}

async function inventoryRequest<T>(path: string, _actor: InventoryActor, init?: RequestInit): Promise<T> {
  const response = await authorizedFetch(`${apiOrigin}/inventory${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null) as { message?: string; detail?: string } | null;
    throw new Error(error?.message ?? error?.detail ?? "耗材服务暂不可用");
  }
  return response.json() as Promise<T>;
}

export const inventoryApi = {
  listStocks: (actor: InventoryActor, storeId?: string) => inventoryRequest<unknown[]>(`/stocks${storeId ? `?store_id=${encodeURIComponent(storeId)}` : ""}`, actor),
  submitRequest: (actor: InventoryActor, input: { storeId: string; consumableId: string; type: "额外领用" | "退回" | "报损"; quantity: number; serviceId?: string; appointmentId?: string; reason: string }) => inventoryRequest<ConsumableTransaction>("/requests", actor, { method: "POST", body: JSON.stringify({ store_id: input.storeId, consumable_id: input.consumableId, type: input.type, quantity: input.quantity, service_id: input.serviceId, appointment_id: input.appointmentId, reason: input.reason }) }),
  approve: (actor: InventoryActor, transactionId: string) => inventoryRequest<ConsumableTransaction>(`/requests/${transactionId}/approve`, actor, { method: "POST" }),
  reject: (actor: InventoryActor, transactionId: string) => inventoryRequest<ConsumableTransaction>(`/requests/${transactionId}/reject`, actor, { method: "POST" }),
};
