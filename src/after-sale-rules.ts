import type { AfterSaleResolution, AfterSaleStatus } from "./types";

const transitions: Record<AfterSaleStatus, AfterSaleStatus[]> = {
  待受理: ["处理中"],
  处理中: ["待审批"],
  待审批: ["待退款", "待重做", "待补偿", "已驳回"],
  待退款: ["已完成"],
  待重做: ["已完成"],
  待补偿: ["已完成"],
  已完成: [],
  已驳回: [],
};

export function canTransitionAfterSale(from: AfterSaleStatus, to: AfterSaleStatus) {
  return transitions[from].includes(to);
}

export function approvedStatus(resolution: AfterSaleResolution): AfterSaleStatus {
  if (resolution === "退款") return "待退款";
  if (resolution === "重新服务") return "待重做";
  return "待补偿";
}
