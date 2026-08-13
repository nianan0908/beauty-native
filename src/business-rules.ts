import type { Appointment, EmployeeItem, MarketplaceStore, ServiceItem, StaffMember, StaffSchedule, StoreInfo } from "./types";

export const APPOINTMENT_BUFFER_MINUTES = 10;

export interface BookingResources {
  marketplaceStore?: MarketplaceStore;
  operationStore?: StoreInfo;
  service?: ServiceItem;
  employee?: EmployeeItem;
  staff?: StaffMember;
  schedule?: StaffSchedule;
}

export type AppointmentInput = Omit<Appointment, "id" | "status">;

export function validateAppointment(
  input: AppointmentInput,
  appointments: Appointment[],
  resources: BookingResources,
) {
  const { marketplaceStore, operationStore, service, employee, staff, schedule } = resources;
  if (!marketplaceStore || marketplaceStore.merchantId !== input.merchantId) return "预约门店不存在或已下线。";
  if (operationStore?.status === "暂停营业") return "当前门店已暂停营业。";
  if (!service || !service.isOnline || !service.bookingEnabled || !service.storeIds?.includes(marketplaceStore.id)) return "该服务当前不可预约。";
  if (!employee || (staff ? staff.storeId !== marketplaceStore.id : !marketplaceStore.employeeIds.includes(employee.id))) return "该员工当前不在这家门店提供服务。";
  if (!employee.serviceIds.includes(service.id) || (staff && !staff.serviceIds.includes(service.id))) return "该员工暂不提供所选服务。";
  if (staff?.status === "停用") return "该员工账号已停用。";

  const start = toMinutes(input.time);
  const end = start + input.duration;
  const [opening, closing] = marketplaceStore.businessHours.split(" - ").map(toMinutes);
  if (start < opening || end > closing) return "所选时间不在门店营业时段内。";
  if (staff && !schedule) return "该员工当天尚未排班。";
  if (schedule && (schedule.type !== "上班" || start < toMinutes(schedule.startTime) || end > toMinutes(schedule.endTime))) {
    return schedule.type === "上班" ? "所选时间不在员工班次内。" : "该员工当天未排班。";
  }

  const hasConflict = appointments.some((item) => {
    if (item.date !== input.date || ["已取消", "未到店"].includes(item.status)) return false;
    const sameEmployee = item.employeeId && input.employeeId ? item.employeeId === input.employeeId : item.employee === input.employee;
    const sameCustomer = item.customerId && input.customerId ? item.customerId === input.customerId : item.customer === input.customer;
    if (!sameEmployee && !sameCustomer) return false;
    const itemStart = toMinutes(item.time);
    return start < itemStart + item.duration + APPOINTMENT_BUFFER_MINUTES
      && itemStart < end + APPOINTMENT_BUFFER_MINUTES;
  });
  return hasConflict ? "所选员工或顾客在相邻时段已有预约。" : null;
}

export function canTransitionAppointment(from: Appointment["status"], to: Appointment["status"]) {
  return (allowedTransitions[from] ?? []).includes(to);
}

const allowedTransitions: Partial<Record<Appointment["status"], Appointment["status"][]>> = {
  待确认: ["已确认", "已取消"],
  已确认: ["已到店", "未到店", "已取消"],
  已到店: ["服务中"],
  服务中: ["已完成"],
};

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}
