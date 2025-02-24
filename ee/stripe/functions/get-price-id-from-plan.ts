import { PLANS, isOldAccount } from "../utils";

export function getPriceIdFromPlan(
  planName: string,
  period: "monthly" | "yearly",
) {
  const env =
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ? "production" : "test";
  const accountType = isOldAccount(planName) ? "old" : "new";
  const cleanPlanName = planName.split("+")[0];

  return PLANS.find((p) => p.name === cleanPlanName)?.price[period].priceIds[
    env
  ][accountType];
}
