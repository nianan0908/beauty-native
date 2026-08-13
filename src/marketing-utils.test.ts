import assert from "node:assert/strict";
import test from "node:test";
import { bestCoupon, couponDiscount, isCouponApplicable } from "./marketing-utils.ts";
import type { PromotionCoupon } from "./types.ts";

const amountCoupon: PromotionCoupon = { id: "C1", merchantId: "T001", title: "满减", description: "", type: "满减券", discountType: "amount", discountValue: 30, minSpend: 258, serviceIds: ["S001"], storeIds: ["MS001"], validFrom: "2026-08-01", validUntil: "2026-08-31", label: "会员" };
const percentCoupon: PromotionCoupon = { ...amountCoupon, id: "C2", title: "九折", type: "折扣券", discountType: "percent", discountValue: 0.9, minSpend: 0 };

test("checks coupon scope and validity", () => {
  assert.equal(isCouponApplicable(amountCoupon, "S001", "MS001", 298), true);
  assert.equal(isCouponApplicable(amountCoupon, "S002", "MS001", 298), false);
  assert.equal(isCouponApplicable(amountCoupon, "S001", "MS006", 298), false);
});

test("selects the coupon with the highest discount", () => {
  assert.equal(couponDiscount(amountCoupon, 298), 30);
  assert.equal(couponDiscount(percentCoupon, 298), 30);
  assert.equal(bestCoupon([percentCoupon, { ...amountCoupon, discountValue: 50 }], "S001", "MS001", 298)?.discountValue, 50);
});
