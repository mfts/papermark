import { PLANS, isOldAccount, planHasDualPricing } from "../utils";

function resolvePlan({
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
    return null;
  }

  return { plan, env: env as "test" | "production", accountType: accountType as "old" | "new", period };
}

/**
 * Returns the base (flat) price ID for a plan.
 * For dual-pricing plans this is the flat plan charge;
 * for single-price plans (Pro) this is the per-user price.
 */
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
  const result = resolvePlan({ planSlug, planName, isOld, period });
  if (!result) return undefined;
  const { plan, env, accountType, period: p } = result;
  return plan.price[p].priceIds[env][accountType];
}

/**
 * Returns the per-seat addon price ID for plans with dual pricing.
 * Returns undefined for single-price plans (Pro).
 */
export function getPerSeatPriceIdFromPlan({
  planSlug,
  planName,
  isOld,
  period,
}: {
  planSlug?: string;
  planName?: string;
  isOld?: boolean;
  period: "monthly" | "yearly";
}): string | undefined {
  const result = resolvePlan({ planSlug, planName, isOld, period });
  if (!result) return undefined;
  const { plan, env, accountType, period: p } = result;
  return plan.price[p].perSeat?.priceIds[env][accountType];
}
