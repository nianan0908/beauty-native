import type { Appointment, Customer, Order } from "./types";

const arrivedStatuses: Appointment["status"][] = ["已到店", "服务中", "已完成"];

export interface VisitEntry {
  customerId: string;
  customer: string;
  phone: string;
  isNew: boolean;
  source: "预约到店" | "现场开单";
  time: string;
  status: Appointment["status"] | Order["status"];
  service: string;
  employee: string;
  appointmentId?: string;
  orderId?: string;
}

export function getTodayVisitEntries(
  appointments: Appointment[],
  orders: Order[],
  customers: Customer[],
  date: string,
  storeId?: string | null,
) {
  const customerById = new Map(customers.map((customer) => [customer.id, customer]));
  const entries = new Map<string, VisitEntry>();

  appointments
    .filter((appointment) => appointment.date === date)
    .filter((appointment) => !storeId || appointment.storeId === storeId)
    .filter((appointment) => arrivedStatuses.includes(appointment.status))
    .forEach((appointment) => {
      const customerId = appointment.customerId ?? `guest:${appointment.phone || appointment.customer}`;
      const customer = appointment.customerId ? customerById.get(appointment.customerId) : undefined;
      entries.set(customerId, {
        customerId,
        customer: customer?.name ?? appointment.customer,
        phone: customer?.phone ?? appointment.phone,
        isNew: customer?.joinedAt === date,
        source: "预约到店",
        time: appointment.time,
        status: appointment.status,
        service: appointment.service,
        employee: appointment.employee,
        appointmentId: appointment.id,
      });
    });

  orders
    .filter((order) => order.createdAt.startsWith(date))
    .filter((order) => !storeId || order.storeId === storeId)
    .filter((order) => !order.appointmentId)
    .forEach((order) => {
      if (entries.has(order.customerId)) return;
      const customer = customerById.get(order.customerId);
      entries.set(order.customerId, {
        customerId: order.customerId,
        customer: customer?.name ?? order.customer,
        phone: customer?.phone ?? "-",
        isNew: customer?.joinedAt === date,
        source: "现场开单",
        time: order.createdAt.slice(11, 16),
        status: order.status,
        service: order.service,
        employee: order.employee,
        orderId: order.id,
      });
    });

  return [...entries.values()].sort((a, b) => a.time.localeCompare(b.time));
}
