import type { Appointment, ConsumableStock, ServiceItem } from "./types";

export function projectedUsage(consumableId: string, storeId: string, appointments: Appointment[], services: ServiceItem[]) {
  const activeStatuses = new Set(["待确认", "已确认", "已到店", "服务中"]);
  return appointments
    .filter((appointment) => appointment.storeId === storeId && activeStatuses.has(appointment.status))
    .reduce((total, appointment) => {
      const service = services.find((item) => item.id === appointment.serviceId);
      return total + (service?.consumables?.find((item) => item.consumableId === consumableId)?.quantity ?? 0);
    }, 0);
}

export function inventoryHealth(stock: ConsumableStock, forecast: number) {
  const availableAfterBookings = stock.quantity - forecast;
  const shortage = Math.max(0, stock.safetyStock - availableAfterBookings);
  return {
    availableAfterBookings,
    shortage,
    status: shortage > 0 ? "需补货" as const : availableAfterBookings <= stock.safetyStock * 1.5 ? "库存偏低" as const : "充足" as const,
  };
}

export function stockEffect(type: "入库" | "标准消耗" | "额外领用" | "退回" | "报损" | "盘点调整", quantity: number) {
  if (type === "入库" || type === "退回") return Math.abs(quantity);
  if (type === "标准消耗" || type === "额外领用" || type === "报损") return -Math.abs(quantity);
  return quantity;
}
