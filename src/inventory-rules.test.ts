import assert from "node:assert/strict";
import test from "node:test";
import { inventoryHealth, projectedUsage, stockEffect } from "./inventory-rules.ts";
import type { Appointment, ConsumableStock, ServiceItem } from "./types.ts";

const stock: ConsumableStock = { id: "ST1", consumableId: "M1", storeId: "STORE1", quantity: 12, safetyStock: 10 };
const service: ServiceItem = { id: "S1", name: "护理", category: "面护", duration: 60, price: 100, tone: "green", consumables: [{ consumableId: "M1", quantity: 3 }] };
const appointment: Appointment = { id: "A1", storeId: "STORE1", serviceId: "S1", date: "2026-08-15", time: "10:00", customer: "顾客", phone: "1", service: "护理", employee: "员工", store: "门店", duration: 60, price: 100, status: "已确认" };

test("有效预约计入预计用量，完成和取消预约不再占用", () => {
  assert.equal(projectedUsage("M1", "STORE1", [appointment], [service]), 3);
  assert.equal(projectedUsage("M1", "STORE1", [{ ...appointment, status: "已完成" }], [service]), 0);
  assert.equal(projectedUsage("M1", "STORE1", [{ ...appointment, status: "已取消" }], [service]), 0);
});

test("当前库存扣除预约占用后低于安全库存会建议补货", () => {
  assert.deepEqual(inventoryHealth(stock, 3), { availableAfterBookings: 9, shortage: 1, status: "需补货" });
});

test("入库退回增加库存，消耗领用和报损减少库存", () => {
  assert.equal(stockEffect("入库", 2), 2);
  assert.equal(stockEffect("退回", 2), 2);
  assert.equal(stockEffect("额外领用", 2), -2);
  assert.equal(stockEffect("报损", 2), -2);
});
