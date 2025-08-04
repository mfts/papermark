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
  const env =
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ? "production" : "test";

  if (planSlug) {
    const accountType = isOld ? "old" : isOldAccount(planSlug) ? "old" : "new";
    const cleanPlanSlug = planSlug.split("+")[0];

    const priceId = PLANS.find((p) => p.slug === cleanPlanSlug)?.price[period]
      .priceIds[env][accountType];
    return priceId;
  }

  if (planName) {
    const accountType = isOld ? "old" : isOldAccount(planName) ? "old" : "new";
    const cleanPlanName = planName.split("+")[0];

    const priceId = PLANS.find((p) => p.name === cleanPlanName)?.price[period]
      .priceIds[env][accountType];
    return priceId;
  }
}
