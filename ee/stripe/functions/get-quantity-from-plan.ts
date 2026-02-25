import { getPlanFromPriceId } from "../utils";

/**
 * For dual-pricing plans this returns the includedUsers count (always 1 for the base item).
 * For legacy single-price plans (Pro) this returns includedUsers (1).
 * Used as the base quantity when creating/updating subscriptions.
 */
export function getQuantityFromPriceId(priceId?: string) {
  if (!priceId) {
    return 1;
  }
  try {
    const plan = getPlanFromPriceId(priceId);
    return plan?.includedUsers ?? 1;
  } catch (error) {
    console.error("Error getting quantity for priceId: %s", priceId, error);
    return 1;
  }
}
