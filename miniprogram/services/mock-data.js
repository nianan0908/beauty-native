const stocks = [
  { consumable_id: "M001", name: "医用补水面膜", category: "面部护理", unit: "片", store_id: "MS001", store_name: "云锦路店", quantity: 24, safety_stock: 10 },
  { consumable_id: "M002", name: "玻尿酸精华液", category: "面部护理", unit: "ml", store_id: "MS001", store_name: "云锦路店", quantity: 165, safety_stock: 100 },
  { consumable_id: "M003", name: "一次性洁面棉", category: "通用耗材", unit: "片", store_id: "MS001", store_name: "云锦路店", quantity: 82, safety_stock: 60 },
  { consumable_id: "M004", name: "肩颈按摩精油", category: "身体护理", unit: "ml", store_id: "MS001", store_name: "云锦路店", quantity: 310, safety_stock: 150 },
  { consumable_id: "M005", name: "深层清洁泥膜", category: "面部护理", unit: "g", store_id: "MS001", store_name: "云锦路店", quantity: 70, safety_stock: 80 },
  { consumable_id: "M006", name: "一次性手套", category: "通用耗材", unit: "双", store_id: "MS001", store_name: "云锦路店", quantity: 35, safety_stock: 30 },
  { consumable_id: "M001", name: "医用补水面膜", category: "面部护理", unit: "片", store_id: "MS006", store_name: "湖滨路店", quantity: 13, safety_stock: 10 },
  { consumable_id: "M003", name: "一次性洁面棉", category: "通用耗材", unit: "片", store_id: "MS006", store_name: "湖滨路店", quantity: 48, safety_stock: 50 },
  { consumable_id: "M007", name: "深润手膜", category: "手部护理", unit: "双", store_id: "MS006", store_name: "湖滨路店", quantity: 16, safety_stock: 8 },
];

let transactions = [
  { id: "MT003", store_id: "MS001", consumable_id: "M001", consumable_name: "医用补水面膜", unit: "片", type: "额外领用", quantity: 2, change: -2, status: "待审批", employee_id: "E003", employee_name: "周琳", service_name: "深层清洁护理", reason: "顾客皮肤状态需要加强湿敷", created_at: "今天 13:42" },
  { id: "MT004", store_id: "MS001", consumable_id: "M003", consumable_name: "一次性洁面棉", unit: "片", type: "报损", quantity: 8, change: -8, status: "待审批", employee_id: "E002", employee_name: "孟然", reason: "包装受潮，申请报损", created_at: "今天 09:18" },
];

const visits = [
  { id: "A1029", time: "11:00", customer: "宋女士", service: "肩颈舒缓 SPA", employee: "孟然", status: "服务中" },
  { id: "A1030", time: "14:00", customer: "陈女士", service: "轻奢手部护理", employee: "苏禾", status: "待确认" },
  { id: "A1031", time: "16:30", customer: "林女士", service: "深层清洁护理", employee: "周琳", status: "已确认" },
];

function dashboard(user) {
  if (user.role === "employee") return { headline: "今天有 3 位顾客", primary: "3", primaryLabel: "今日服务", secondary: "¥18,920", secondaryLabel: "本月业绩", pending: 1, lowStock: 2 };
  if (user.role === "manager") return { headline: "今日门店运营平稳", primary: "12", primaryLabel: "今日预约", secondary: "¥6,280", secondaryLabel: "今日实收", pending: 2, lowStock: 3 };
  return { headline: "两店经营正常", primary: "¥42,860", primaryLabel: "本月实收", secondary: "486", secondaryLabel: "活跃会员", pending: 2, lowStock: 4 };
}

function appointments(user) {
  return user.role === "employee" ? visits.filter((item) => item.employee === user.name) : visits;
}

function handle(path, user, options) {
  if (path.startsWith("/inventory/stocks")) return user.role === "owner" ? stocks : stocks.filter((item) => item.store_id === user.storeId);
  if (path.startsWith("/inventory/transactions")) return user.role === "employee" ? transactions.filter((item) => item.employee_id === user.id) : transactions.filter((item) => user.role === "owner" || item.store_id === user.storeId);
  if (path === "/inventory/requests" && options.method === "POST") {
    const data = options.data;
    const item = stocks.find((stock) => stock.consumable_id === data.consumable_id);
    const created = { id: `MT${Date.now()}`, store_id: data.store_id, consumable_id: data.consumable_id, consumable_name: item && item.name, unit: item && item.unit, type: data.type, quantity: data.quantity, change: data.type === "退回" ? data.quantity : -data.quantity, status: "待审批", employee_id: user.id, employee_name: user.name, reason: data.reason, created_at: "刚刚" };
    transactions.unshift(created);
    return created;
  }
  const match = path.match(/^\/inventory\/requests\/([^/]+)\/(approve|reject)$/);
  if (match) {
    transactions = transactions.map((item) => item.id === match[1] ? { ...item, status: match[2] === "approve" ? "已通过" : "已驳回" } : item);
    return transactions.find((item) => item.id === match[1]);
  }
  return null;
}

module.exports = { dashboard, appointments, handle };
