import type { PromotionCoupon } from "./types";
import { DEMO_TODAY } from "./demo-context.ts";

export function couponDiscount(coupon: PromotionCoupon, price: number) {
  if (coupon.discountType === "amount") return Math.min(price, coupon.discountValue);
  return Math.round(price * (1 - coupon.discountValue));
}

export function isCouponApplicable(coupon: PromotionCoupon, serviceId: string, storeId: string, price: number) {
  return coupon.validFrom <= DEMO_TODAY
    && coupon.validUntil >= DEMO_TODAY
    && price >= coupon.minSpend
    && (!coupon.serviceIds || coupon.serviceIds.includes(serviceId))
    && (!coupon.storeIds || coupon.storeIds.includes(storeId));
}

export function bestCoupon(coupons: PromotionCoupon[], serviceId: string, storeId: string, price: number) {
  return coupons
    .filter((coupon) => isCouponApplicable(coupon, serviceId, storeId, price))
    .sort((left, right) => couponDiscount(right, price) - couponDiscount(left, price))[0] ?? null;
}

export function couponValueText(coupon: PromotionCoupon) {
  return coupon.discountType === "amount" ? `¥${coupon.discountValue}` : `${coupon.discountValue * 10}折`;
}
