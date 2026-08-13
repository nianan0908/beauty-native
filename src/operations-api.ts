import { authorizedFetch } from "./auth-api";
import type { Role, ServiceItem, StaffMember, StaffSchedule, StoreInfo } from "./types";

const apiOrigin = (import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1").replace(/\/$/, "");

interface ApiStore {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  phone: string;
  businessHours: string;
  managerStaffId: string | null;
  status: "open" | "paused";
}

interface ApiStaff {
  id: string;
  tenantId: string;
  storeId: string;
  name: string;
  phone: string;
  title: string;
  role: "manager" | "receptionist" | "employee";
  status: "active" | "disabled";
  joinedAt: string;
  monthlyTarget: string;
  serviceIds: string[];
  services: string[];
}

interface ApiService {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  duration: number;
  price: string;
  tone: string;
  storeIds: string[];
  isOnline: boolean;
  bookingEnabled: boolean;
}

interface ApiSchedule {
  id: string;
  tenantId: string;
  storeId: string;
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: "work" | "rest" | "leave";
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await authorizedFetch(`${apiOrigin}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(error?.message ?? "主数据服务暂不可用，请稍后重试。");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const staffRoleToApi: Record<StaffMember["role"], ApiStaff["role"]> = {
  店长: "manager",
  前台: "receptionist",
  员工: "employee",
};

const staffRoleFromApi: Record<ApiStaff["role"], StaffMember["role"]> = {
  manager: "店长",
  receptionist: "前台",
  employee: "员工",
};

const scheduleTypeToApi: Record<StaffSchedule["type"], ApiSchedule["type"]> = {
  上班: "work",
  休息: "rest",
  请假: "leave",
};

const scheduleTypeFromApi: Record<ApiSchedule["type"], StaffSchedule["type"]> = {
  work: "上班",
  rest: "休息",
  leave: "请假",
};

function mapStaff(item: ApiStaff): StaffMember {
  return {
    id: item.id,
    name: item.name,
    phone: item.phone,
    title: item.title,
    role: staffRoleFromApi[item.role],
    storeId: item.storeId,
    services: item.services,
    serviceIds: item.serviceIds,
    status: item.status === "active" ? "在职" : "停用",
    joinedAt: item.joinedAt,
    monthlyTarget: Number(item.monthlyTarget),
  };
}

function mapService(item: ApiService, previous?: ServiceItem): ServiceItem {
  return {
    id: item.id,
    merchantId: item.tenantId,
    name: item.name,
    category: item.category,
    duration: item.duration,
    price: Number(item.price),
    tone: item.tone,
    storeIds: item.storeIds,
    isOnline: item.isOnline,
    bookingEnabled: item.bookingEnabled,
    consumables: previous?.consumables,
  };
}

function mapSchedule(item: ApiSchedule): StaffSchedule {
  return {
    id: item.id,
    employeeId: item.staffId,
    date: item.date,
    startTime: item.startTime.slice(0, 5),
    endTime: item.endTime.slice(0, 5),
    type: scheduleTypeFromApi[item.type],
  };
}

function mapStore(item: ApiStore, staff: StaffMember[]): StoreInfo {
  return {
    id: item.id,
    merchantId: item.tenantId,
    name: item.name,
    address: item.address,
    phone: item.phone,
    manager: staff.find((member) => member.id === item.managerStaffId)?.name ?? "暂未分配",
    businessHours: item.businessHours,
    status: item.status === "open" ? "营业中" : "暂停营业",
    members: 0,
    employees: staff.filter((member) => member.storeId === item.id && member.status === "在职").length,
    monthlyRevenue: 0,
  };
}

export const operationsApi = {
  async load(
    role: Role,
    previous: Pick<
      { staff: StaffMember[]; stores: StoreInfo[]; services: ServiceItem[]; schedules: StaffSchedule[] },
      "staff" | "stores" | "services" | "schedules"
    >,
  ) {
    if (role === "customer" || role === "platform") return null;
    const canReadStaff = role !== "employee";
    const canReadSchedules = role !== "receptionist";
    const [rawStaff, rawStores, rawServices, rawSchedules] = await Promise.all([
      canReadStaff ? request<ApiStaff[]>("/staff") : Promise.resolve(null),
      request<ApiStore[]>("/stores"),
      request<ApiService[]>("/services"),
      canReadSchedules ? request<ApiSchedule[]>("/schedules") : Promise.resolve(null),
    ]);
    const staff = rawStaff?.map(mapStaff) ?? previous.staff;
    return {
      staff,
      stores: rawStores.map((item) => mapStore(item, staff)),
      services: rawServices.map((item) => mapService(
        item,
        previous.services.find((existing) => existing.id === item.id),
      )),
      schedules: rawSchedules?.map(mapSchedule) ?? previous.schedules,
    };
  },

  async saveStore(store: StoreInfo, exists: boolean, staff: StaffMember[]) {
    const managerStaffId = staff.find((member) => member.name === store.manager)?.id ?? null;
    const payload = {
      name: store.name,
      address: store.address,
      phone: store.phone,
      businessHours: store.businessHours,
      managerStaffId,
    };
    const saved = await request<ApiStore>(exists ? `/stores/${store.id}` : "/stores", {
      method: exists ? "PATCH" : "POST",
      body: JSON.stringify(payload),
    });
    return mapStore(saved, staff);
  },

  async toggleStore(store: StoreInfo, staff: StaffMember[]) {
    const action = store.status === "营业中" ? "pause" : "resume";
    return mapStore(await request<ApiStore>(`/stores/${store.id}/${action}`, { method: "POST" }), staff);
  },

  async saveStaff(member: StaffMember, exists: boolean) {
    const payload = {
      name: member.name,
      phone: member.phone,
      title: member.title,
      role: staffRoleToApi[member.role],
      storeId: member.storeId,
      joinedAt: member.joinedAt,
      monthlyTarget: member.monthlyTarget,
      ...(exists ? {} : { serviceIds: member.serviceIds }),
    };
    let saved = await request<ApiStaff>(exists ? `/staff/${member.id}` : "/staff", {
      method: exists ? "PATCH" : "POST",
      body: JSON.stringify(payload),
    });
    if (exists) {
      saved = await request<ApiStaff>(`/staff/${member.id}/services`, {
        method: "PUT",
        body: JSON.stringify({ serviceIds: member.serviceIds }),
      });
    }
    return mapStaff(saved);
  },

  async toggleStaff(member: StaffMember) {
    const action = member.status === "在职" ? "disable" : "enable";
    return mapStaff(await request<ApiStaff>(`/staff/${member.id}/${action}`, { method: "POST" }));
  },

  async saveService(service: ServiceItem, exists: boolean, previous?: ServiceItem) {
    const payload = {
      name: service.name,
      category: service.category,
      duration: service.duration,
      price: service.price,
      tone: service.tone,
      storeIds: service.storeIds,
      isOnline: service.isOnline,
      bookingEnabled: service.bookingEnabled,
    };
    const saved = await request<ApiService>(exists ? `/services/${service.id}` : "/services", {
      method: exists ? "PATCH" : "POST",
      body: JSON.stringify(payload),
    });
    return mapService(saved, previous ?? service);
  },

  async toggleService(service: ServiceItem) {
    const action = service.isOnline ? "unpublish" : "publish";
    return mapService(
      await request<ApiService>(`/services/${service.id}/${action}`, { method: "POST" }),
      service,
    );
  },

  async saveSchedules(entries: StaffSchedule[]) {
    const saved = await request<ApiSchedule[]>("/schedules/batch", {
      method: "PUT",
      body: JSON.stringify({ entries: entries.map((entry) => ({
        staffId: entry.employeeId,
        date: entry.date,
        startTime: entry.startTime,
        endTime: entry.endTime,
        type: scheduleTypeToApi[entry.type],
      })) }),
    });
    return saved.map(mapSchedule);
  },

  deleteSchedule: (scheduleId: string) => request<void>(`/schedules/${scheduleId}`, { method: "DELETE" }),
};
