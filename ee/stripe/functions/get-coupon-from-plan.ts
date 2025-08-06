import { isOldAccount } from "../utils";

const COUPON_MAP = {
  monthly: {
    old: "uAYqcOkk",
    new: "BuzdmLfl",
  },
  yearly: {
    old: "9VvXFpF0",
    new: "pgJhUesw",
  },
};

export const getCouponFromPlan = (plan: string, isAnnualPlan: boolean) => {
  const period = isAnnualPlan ? "yearly" : "monthly";
  return isOldAccount(plan) ? COUPON_MAP[period].old : COUPON_MAP[period].new;
};
