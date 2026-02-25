import Stripe from "stripe";

import {
  Plan,
  getPlanFromPriceId,
  isPerSeatPriceId,
  planHasDualPricing,
} from "../utils";

interface SubscriptionPlanInfo {
  plan: Plan;
  totalUsers: number;
  additionalUsers: number;
}

/**
 * Extracts plan info and total user count from a Stripe subscription's items.
 *
 * Handles both:
 *   - Dual-pricing subscriptions (base flat price + per-seat addon)
 *   - Legacy single-price subscriptions (per-user × quantity)
 */
export function getPlanFromSubscriptionItems(
  items: Stripe.SubscriptionItem[],
  isOldAccount: boolean = false,
): SubscriptionPlanInfo | null {
  if (items.length === 0) return null;

  let basePlan: Plan | null = null;
  let baseQuantity = 1;
  let perSeatQuantity = 0;

  for (const item of items) {
    const priceId = item.price.id;
    const qty = item.quantity ?? 0;

    if (isPerSeatPriceId(priceId, isOldAccount)) {
      perSeatQuantity = qty;
    } else {
      basePlan = getPlanFromPriceId(priceId, isOldAccount) as Plan | null;
      baseQuantity = qty;
    }
  }

  if (!basePlan) return null;

  const isDual = planHasDualPricing(basePlan);

  if (isDual) {
    // Dual pricing: base includes `includedUsers`, additional from per-seat item
    const totalUsers = basePlan.includedUsers + perSeatQuantity;
    return { plan: basePlan, totalUsers, additionalUsers: perSeatQuantity };
  }

  // Legacy single-price: quantity IS the total user count
  const totalUsers =
    baseQuantity > basePlan.includedUsers ? baseQuantity : basePlan.includedUsers;
  return {
    plan: basePlan,
    totalUsers,
    additionalUsers: Math.max(0, baseQuantity - basePlan.includedUsers),
  };
}
