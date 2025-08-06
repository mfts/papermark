import { PLANS, isOldAccount } from "../utils";

export function getPriceIdFromPlan({
  planSlug,
  planName,
  isOld,
  period,
}: {
  planSlug?: string;
  planName?: string;
  isOld?: boolean;
  period: "monthly" | "yearly";
}) {
  if (!planSlug && !planName) {
    throw new Error("Either planSlug or planName must be provided");
  }
  const env =
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ? "production" : "test";

  const planIdentifier = planSlug || planName;
  const accountType = isOld
    ? "old"
    : isOldAccount(planIdentifier!)
      ? "old"
      : "new";
  const cleanPlan = planIdentifier!.split("+")[0];

  const plan = PLANS.find((p) =>
    planSlug ? p.slug === cleanPlan : p.name === cleanPlan,
  );

  if (!plan) {
    console.error(`Plan not found: ${cleanPlan}`);
    return undefined;
  }

  return plan.price[period].priceIds[env][accountType];
}
