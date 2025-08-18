import { getPlanFromPriceId } from "../utils";

export function getQuantityFromPriceId(priceId?: string) {
  if (!priceId) {
    return 1;
  }
  try {
    const plan = getPlanFromPriceId(priceId);
    return plan?.minQuantity ?? 1;
  } catch (error) {
    console.error("Error getting quantity for priceId: %s", priceId, error);
    return 1;
  }
}
