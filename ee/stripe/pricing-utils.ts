import { PLANS, getPlanFromPriceId } from "./utils";

export interface PricingCalculation {
  basePriceAmount: number;
  additionalUsersCount: number;
  additionalUsersPrice: number;
  totalPrice: number;
  currency: string;
}

/**
 * Calculates hybrid pricing for a plan with base price + additional user pricing
 */
export function calculateHybridPricing(
  planSlug: string,
  totalUsers: number,
  period: "monthly" | "yearly"
): PricingCalculation | null {
  const plan = PLANS.find((p) => p.slug === planSlug);
  
  if (!plan || !plan.baseUsers) {
    return null;
  }

  const priceConfig = plan.price[period];
  const baseUsers = plan.baseUsers;
  const basePriceAmount = priceConfig.amount;
  const additionalUsersCount = Math.max(0, totalUsers - baseUsers);
  const additionalUserPrice = priceConfig.unitPrice / 100; // Convert from cents
  const additionalUsersPrice = additionalUsersCount * additionalUserPrice;
  const totalPrice = basePriceAmount + additionalUsersPrice;

  return {
    basePriceAmount,
    additionalUsersCount,
    additionalUsersPrice,
    totalPrice,
    currency: "EUR", // Assuming EUR based on your constants
  };
}

/**
 * Gets the appropriate price IDs for hybrid pricing checkout
 */
export function getHybridPriceIds(
  planSlug: string,
  period: "monthly" | "yearly",
  isOldAccount: boolean = false
) {
  const plan = PLANS.find((p) => p.slug === planSlug);
  
  if (!plan || !plan.baseUsers) {
    return null;
  }

  const env =
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ? "production" : "test";
  const accountType = isOldAccount ? "old" : "new";
  const priceConfig = plan.price[period];

  return {
    basePriceId: priceConfig.basePriceIds?.[env]?.[accountType] || priceConfig.priceIds[env][accountType],
    additionalUserPriceId: priceConfig.additionalUserPriceIds?.[env]?.[accountType],
    baseUsers: plan.baseUsers,
    planSlug: plan.slug,
  };
}

/**
 * Creates line items for Stripe checkout with hybrid pricing
 */
export function createHybridLineItems(
  planSlug: string,
  totalUsers: number,
  period: "monthly" | "yearly",
  isOldAccount: boolean = false
) {
  const priceIds = getHybridPriceIds(planSlug, period, isOldAccount);
  const plan = PLANS.find((p) => p.slug === planSlug);
  
  if (!priceIds || !plan) {
    // Fallback to old method for backward compatibility
    const oldPlan = PLANS.find((p) => p.slug === planSlug);
    if (!oldPlan) return null;
    
    const env = process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ? "production" : "test";
    const accountType = isOldAccount ? "old" : "new";
    const priceId = oldPlan.price[period].priceIds[env][accountType];
    
    return [{
      price: priceId,
      quantity: Math.max(totalUsers, oldPlan.minQuantity),
    }];
  }

  const lineItems = [];
  
  // Base price line item (always quantity 1)
  lineItems.push({
    price: priceIds.basePriceId,
    quantity: 1,
  });

  // Additional users line item (only if needed)
  const additionalUsers = Math.max(0, totalUsers - priceIds.baseUsers);
  if (additionalUsers > 0 && priceIds.additionalUserPriceId) {
    lineItems.push({
      price: priceIds.additionalUserPriceId,
      quantity: additionalUsers,
      adjustable_quantity: {
        enabled: true,
        minimum: 0,
        maximum: 50,
      },
    });
  }

  return lineItems;
}

/**
 * Determines if a plan supports hybrid pricing
 */
export function isHybridPricingPlan(planSlug: string): boolean {
  const plan = PLANS.find((p) => p.slug === planSlug);
  return !!(plan && plan.baseUsers && plan.baseUsers > 0);
}

/**
 * Gets minimum users for a plan (same as baseUsers for hybrid plans)
 */
export function getMinimumUsers(planSlug: string): number {
  const plan = PLANS.find((p) => p.slug === planSlug);
  if (!plan) return 1;
  
  return plan.baseUsers || plan.minQuantity || 1;
}

/**
 * Formats pricing display for hybrid plans
 */
export function formatHybridPricing(
  planSlug: string,
  period: "monthly" | "yearly"
): string {
  const plan = PLANS.find((p) => p.slug === planSlug);
  
  if (!plan || !plan.baseUsers) {
    return "";
  }

  const priceConfig = plan.price[period];
  const basePrice = priceConfig.amount;
  const baseUsers = plan.baseUsers;
  const additionalUserPrice = Math.round(priceConfig.unitPrice / 100);
  const periodLabel = period === "monthly" ? "month" : "year";

  return `€${basePrice}/${periodLabel} (${baseUsers} users included) + €${additionalUserPrice}/${periodLabel === "year" ? "month" : periodLabel} per additional user`;
}

/**
 * Calculates total users from subscription items for hybrid pricing
 */
export function calculateTotalUsersFromSubscription(
  subscriptionItems: Stripe.SubscriptionItem[],
  planSlug: string
): number {
  const plan = PLANS.find((p) => p.slug === planSlug);
  
  if (!plan || !plan.baseUsers || !isHybridPricingPlan(planSlug)) {
    // For legacy pricing, return the quantity from the first item
    return subscriptionItems[0]?.quantity || 1;
  }

  // For hybrid pricing, we need to calculate based on base users + additional users
  const baseUsers = plan.baseUsers;
  let additionalUsers = 0;

  // Find additional user line item
  for (const item of subscriptionItems) {
    const priceId = item.price.id;
    const env = process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ? "production" : "test";
    
    // Check if this price ID matches any of our additional user price IDs
    const monthlyAdditionalIds = plan.price.monthly.additionalUserPriceIds?.[env];
    const yearlyAdditionalIds = plan.price.yearly.additionalUserPriceIds?.[env];
    
    const isAdditionalUserPrice = (
      monthlyAdditionalIds && (
        priceId === monthlyAdditionalIds.old ||
        priceId === monthlyAdditionalIds.new
      )
    ) || (
      yearlyAdditionalIds && (
        priceId === yearlyAdditionalIds.old ||
        priceId === yearlyAdditionalIds.new
      )
    );

    if (isAdditionalUserPrice) {
      additionalUsers = item.quantity || 0;
      break;
    }
  }

  return baseUsers + additionalUsers;
}

/**
 * Gets the primary plan from subscription items (looks for base price)
 */
export function getPlanFromSubscriptionItems(
  subscriptionItems: Stripe.SubscriptionItem[],
  isOldAccount: boolean = false
): any {
  // Try to find the plan from any of the subscription items
  for (const item of subscriptionItems) {
    const plan = getPlanFromPriceId(item.price.id, isOldAccount);
    if (plan) {
      return plan;
    }
  }
  return null;
}