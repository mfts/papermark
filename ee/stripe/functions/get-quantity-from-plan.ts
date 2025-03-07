import { PLANS, getPlanFromPriceId } from "../utils";

export function getQuantityFromPriceId(priceId?: string) {
  if (!priceId) {
    return 1;
  }
  const plan = getPlanFromPriceId(priceId);
  return plan.minQuantity ?? 1;
}
