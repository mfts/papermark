import { PLANS, getPlanFromPriceId } from "../utils";

export function getQuantityFromPriceId(priceId?: string) {
  if (!priceId) {
    return 1;
  }
  const plan = getPlanFromPriceId(priceId);
  if (!plan) {
    return 1; // Default quantity for free plans or when plan is not found
  }
  return plan.minQuantity ?? 1;
}
