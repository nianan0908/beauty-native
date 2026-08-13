export const DEMO_TODAY = "2026-08-13";

export const DEMO_CONTEXT = {
  merchantId: "T001",
  customerId: "C001",
  customerName: "周小姐",
  customerPhone: "139****2026",
  employeeId: "E001",
  employeeName: "苏禾",
  defaultStoreId: "MS001",
} as const;

export function formatLocalDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + days);
  return formatLocalDate(value);
}

export function addMonths(date: string, months: number) {
  const value = new Date(`${date}T00:00:00`);
  value.setMonth(value.getMonth() + months);
  return formatLocalDate(value);
}

export function demoTimestamp() {
  return `${DEMO_TODAY} ${new Date().toTimeString().slice(0, 5)}`;
}
