import type { ConsumableItem, ConsumableStock, ConsumableTransaction } from "./types";

export const consumables: ConsumableItem[] = [
  { id: "M001", merchantId: "T001", name: "医用补水面膜", category: "面部护理", unit: "片", unitCost: 18, enabled: true },
  { id: "M002", merchantId: "T001", name: "玻尿酸精华液", category: "面部护理", unit: "ml", unitCost: 3.2, enabled: true },
  { id: "M003", merchantId: "T001", name: "一次性洁面棉", category: "通用耗材", unit: "片", unitCost: 0.4, enabled: true },
  { id: "M004", merchantId: "T001", name: "肩颈按摩精油", category: "身体护理", unit: "ml", unitCost: 1.8, enabled: true },
  { id: "M005", merchantId: "T001", name: "深层清洁泥膜", category: "面部护理", unit: "g", unitCost: 1.5, enabled: true },
  { id: "M006", merchantId: "T001", name: "一次性手套", category: "通用耗材", unit: "双", unitCost: 1.2, enabled: true },
  { id: "M007", merchantId: "T001", name: "深润手膜", category: "手部护理", unit: "双", unitCost: 12, enabled: true },
];

export const consumableStocks: ConsumableStock[] = [
  { id: "ST-M001-MS001", consumableId: "M001", storeId: "MS001", quantity: 24, safetyStock: 10 },
  { id: "ST-M002-MS001", consumableId: "M002", storeId: "MS001", quantity: 165, safetyStock: 100 },
  { id: "ST-M003-MS001", consumableId: "M003", storeId: "MS001", quantity: 82, safetyStock: 60 },
  { id: "ST-M004-MS001", consumableId: "M004", storeId: "MS001", quantity: 310, safetyStock: 150 },
  { id: "ST-M005-MS001", consumableId: "M005", storeId: "MS001", quantity: 70, safetyStock: 80 },
  { id: "ST-M006-MS001", consumableId: "M006", storeId: "MS001", quantity: 35, safetyStock: 30 },
  { id: "ST-M001-MS006", consumableId: "M001", storeId: "MS006", quantity: 13, safetyStock: 10 },
  { id: "ST-M002-MS006", consumableId: "M002", storeId: "MS006", quantity: 90, safetyStock: 80 },
  { id: "ST-M003-MS006", consumableId: "M003", storeId: "MS006", quantity: 48, safetyStock: 50 },
  { id: "ST-M005-MS006", consumableId: "M005", storeId: "MS006", quantity: 95, safetyStock: 70 },
  { id: "ST-M006-MS006", consumableId: "M006", storeId: "MS006", quantity: 28, safetyStock: 25 },
  { id: "ST-M007-MS006", consumableId: "M007", storeId: "MS006", quantity: 16, safetyStock: 8 },
];

export const consumableTransactions: ConsumableTransaction[] = [
  { id: "MT001", merchantId: "T001", storeId: "MS001", consumableId: "M001", type: "标准消耗", quantity: 1, change: -1, status: "已通过", employeeId: "E001", employeeName: "苏禾", serviceId: "S001", appointmentId: "A1028", operator: "系统", createdAt: "2026-08-13 10:30", approvedAt: "2026-08-13 10:30" },
  { id: "MT002", merchantId: "T001", storeId: "MS001", consumableId: "M002", type: "标准消耗", quantity: 10, change: -10, status: "已通过", employeeId: "E001", employeeName: "苏禾", serviceId: "S001", appointmentId: "A1028", operator: "系统", createdAt: "2026-08-13 10:30", approvedAt: "2026-08-13 10:30" },
  { id: "MT003", merchantId: "T001", storeId: "MS001", consumableId: "M001", type: "额外领用", quantity: 2, change: -2, status: "待审批", employeeId: "E003", employeeName: "周琳", serviceId: "S004", appointmentId: "A1031", reason: "顾客皮肤状态需要加强湿敷", operator: "周琳", createdAt: "2026-08-13 13:42" },
  { id: "MT004", merchantId: "T001", storeId: "MS001", consumableId: "M003", type: "报损", quantity: 8, change: -8, status: "待审批", employeeId: "E002", employeeName: "孟然", reason: "包装受潮，申请报损", operator: "孟然", createdAt: "2026-08-13 09:18" },
  { id: "MT005", merchantId: "T001", storeId: "MS001", consumableId: "M004", type: "额外领用", quantity: 35, change: -35, status: "已通过", employeeId: "E002", employeeName: "孟然", serviceId: "S002", reason: "加做背部放松", operator: "孟然", approver: "陈妍", createdAt: "2026-08-12 16:35", approvedAt: "2026-08-12 16:46" },
];
