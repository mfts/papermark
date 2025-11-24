import { isOldAccount } from "../utils";

const COUPON_MAP = {
  monthly: {
    old: "w15almTc",
    new: "jTyAvVA6",
  },
  yearly: {
    old: "qB9tm34e",
    new: "EDTyNLr5",
  },
};

export const getCouponFromPlan = (plan: string, isAnnualPlan: boolean) => {
  const period = isAnnualPlan ? "yearly" : "monthly";
  return isOldAccount(plan) ? COUPON_MAP[period].old : COUPON_MAP[period].new;
};
