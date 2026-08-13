import assert from "node:assert/strict";
import test from "node:test";
import { approvedStatus, canTransitionAfterSale } from "./after-sale-rules.ts";

test("enforces the after-sale workflow", () => {
  assert.equal(canTransitionAfterSale("待受理", "处理中"), true);
  assert.equal(canTransitionAfterSale("待受理", "待审批"), false);
  assert.equal(canTransitionAfterSale("待审批", "待退款"), true);
  assert.equal(canTransitionAfterSale("已完成", "处理中"), false);
});

test("maps approved resolutions to execution states", () => {
  assert.equal(approvedStatus("退款"), "待退款");
  assert.equal(approvedStatus("重新服务"), "待重做");
  assert.equal(approvedStatus("恢复卡次"), "待补偿");
});
