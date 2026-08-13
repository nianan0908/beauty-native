import assert from "node:assert/strict";
import test from "node:test";
import { getTodayVisitEntries } from "./dashboard-metrics.ts";
import type { Appointment, Customer, Order } from "./types.ts";

const customers: Customer[] = [
  { id: "C1", name: "老客", phone: "1", level: "普通会员", tags: [], totalSpend: 0, visits: 2, lastVisit: "", joinedAt: "2026-01-01" },
  { id: "C2", name: "新客", phone: "2", level: "普通会员", tags: [], totalSpend: 0, visits: 0, lastVisit: "", joinedAt: "2026-08-13" },
];
const baseAppointment: Appointment = { id: "A1", customerId: "C1", storeId: "S1", date: "2026-08-13", time: "10:00", customer: "老客", phone: "1", service: "护理", employee: "苏禾", store: "一店", duration: 60, price: 100, status: "已完成" };
const baseOrder: Order = { id: "O1", customerId: "C2", storeId: "S1", customer: "新客", service: "护理", employee: "苏禾", store: "一店", amount: 100, discount: 0, payable: 100, status: "待结算", createdAt: "2026-08-13 11:00" };

test("counts arrived appointments and walk-ins while excluding confirmed bookings", () => {
  const entries = getTodayVisitEntries(
    [baseAppointment, { ...baseAppointment, id: "A2", customerId: "C2", customer: "新客", status: "已确认" }],
    [baseOrder],
    customers,
    "2026-08-13",
    "S1",
  );
  assert.deepEqual(entries.map((entry) => entry.source), ["预约到店", "现场开单"]);
  assert.equal(entries.filter((entry) => entry.isNew).length, 1);
});

test("deduplicates a member and excludes appointment-generated orders", () => {
  const entries = getTodayVisitEntries(
    [baseAppointment],
    [{ ...baseOrder, customerId: "C1" }, { ...baseOrder, id: "O2", appointmentId: "A1", customerId: "C1" }],
    customers,
    "2026-08-13",
  );
  assert.equal(entries.length, 1);
  assert.equal(entries[0].source, "预约到店");
});
