import assert from "node:assert/strict";
import test from "node:test";
import { canTransitionAppointment, validateAppointment } from "./business-rules.ts";
import type { Appointment, EmployeeItem, MarketplaceStore, ServiceItem, StaffMember, StaffSchedule, StoreInfo } from "./types.ts";

const store: MarketplaceStore = {
  id: "MS001", merchantId: "T001", merchantName: "栖光美学", name: "云锦路店", category: "面部护理",
  coverImage: "", rating: 4.9, reviewCount: 1, distance: 1, address: "", businessHours: "09:30 - 21:00",
  tags: [], serviceIds: ["S001"], employeeIds: ["E001"],
};
const operationStore: StoreInfo = { id: "MS001", merchantId: "T001", name: "云锦路店", address: "", phone: "", manager: "", businessHours: "09:30 - 21:00", status: "营业中", members: 0, employees: 1, monthlyRevenue: 0 };
const service: ServiceItem = { id: "S001", merchantId: "T001", storeIds: ["MS001"], isOnline: true, bookingEnabled: true, category: "面部护理", name: "水光焕肤护理", duration: 60, price: 298, tone: "service-green" };
const employee: EmployeeItem = { id: "E001", name: "苏禾", title: "资深美容师", rating: "4.9", serviceIds: ["S001"] };
const staff: StaffMember = { id: "E001", name: "苏禾", phone: "", title: "资深美容师", role: "员工", storeId: "MS001", services: ["水光焕肤护理"], serviceIds: ["S001"], status: "在职", joinedAt: "2024-01-01", monthlyTarget: 1 };
const schedule: StaffSchedule = { id: "SH001", employeeId: "E001", date: "2026-08-14", startTime: "09:30", endTime: "18:30", type: "上班" };
const input = { merchantId: "T001", storeId: "MS001", customerId: "C001", serviceId: "S001", employeeId: "E001", date: "2026-08-14", time: "14:00", customer: "周小姐", phone: "", service: "水光焕肤护理", employee: "苏禾", store: "云锦路店", duration: 60, price: 298 };
const resources = { marketplaceStore: store, operationStore, service, employee, staff, schedule };

test("allows a valid appointment", () => {
  assert.equal(validateAppointment(input, [], resources), null);
});

test("blocks an employee conflict even when the existing appointment is in another store", () => {
  const existing: Appointment = { ...input, id: "A001", storeId: "MS006", store: "湖滨路店", time: "14:30", status: "已确认" };
  assert.match(validateAppointment(input, [existing], resources) ?? "", /员工或顾客/);
});

test("keeps a ten minute cleanup buffer between appointments", () => {
  const existing: Appointment = { ...input, id: "A001", time: "15:05", status: "已确认" };
  assert.match(validateAppointment(input, [existing], resources) ?? "", /相邻时段/);
});

test("blocks closed stores, unsupported services and missing shifts", () => {
  assert.match(validateAppointment(input, [], { ...resources, operationStore: { ...operationStore, status: "暂停营业" } }) ?? "", /暂停营业/);
  assert.match(validateAppointment(input, [], { ...resources, employee: { ...employee, serviceIds: [] } }) ?? "", /暂不提供/);
  assert.match(validateAppointment(input, [], { ...resources, schedule: undefined }) ?? "", /尚未排班/);
});

test("blocks times outside the employee shift", () => {
  assert.match(validateAppointment({ ...input, time: "18:00" }, [], resources) ?? "", /员工班次/);
});

test("enforces the appointment state machine", () => {
  assert.equal(canTransitionAppointment("待确认", "已确认"), true);
  assert.equal(canTransitionAppointment("待确认", "已完成"), false);
  assert.equal(canTransitionAppointment("已完成", "已取消"), false);
});
