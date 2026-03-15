import Stripe from "stripe";

// Historical price IDs that are no longer in the main PLANS configuration
// but still need to be supported for existing subscriptions.
// This includes the old per-user price IDs from before the dual-pricing refactor.
const HISTORICAL_PRICE_IDS: Record<string, Record<string, string>> = {
  production: {
    price_1OuYeIFJyGSZ96lhwH58Y1kU: "business",
    // Legacy per-user price IDs (pre dual-pricing refactor)
    price_1Q3gbVFJyGSZ96lhf7hsZciQ: "business",
    price_1Q8egwBYvhH6u7U7XKLGjgHL: "business",
    price_1Q3gbVFJyGSZ96lhqqLhBNDv: "business",
    price_1Q8egwBYvhH6u7U7wRU6iPcW: "business",
    price_1Q3gbbFJyGSZ96lhvmEwjZtm: "datarooms",
    price_1Q8egzBYvhH6u7U7IQUGzwoZ: "datarooms",
    price_1Q3gbbFJyGSZ96lhnk1CtnIZ: "datarooms",
    price_1Q8egzBYvhH6u7U7M2uoROMa: "datarooms",
    price_1QwMmmFJyGSZ96lhhaDXmzkY: "datarooms-plus",
    price_1QwMkABYvhH6u7U74ccUfWkq: "datarooms-plus",
    price_1QwMmeFJyGSZ96lh934mFNPA: "datarooms-plus",
    price_1QwMjABYvhH6u7U7ccxGJXKN: "datarooms-plus",
    price_placeholder_prod_old: "datarooms-premium",
    price_1SUWXqBYvhH6u7U7SJKKOCKU: "datarooms-premium",
    price_placeholder_prod_yearly_old: "datarooms-premium",
    price_1SUWWqBYvhH6u7U7I5MpZ43K: "datarooms-premium",
  },
  test: {
    price_1Q3bPhFJyGSZ96lhnxpiJMwz: "business",
    price_1Q8aWlBYvhH6u7U7gTeKJJ0Y: "business",
    price_1Q3bQ5FJyGSZ96lhoS8QbYXr: "business",
    price_1Q8aVSBYvhH6u7U72mn6iPfK: "business",
    price_1Q3bHPFJyGSZ96lhpQD0lMdU: "datarooms",
    price_1Q8aYLBYvhH6u7U7RUqHnsBh: "datarooms",
    price_1Q3bJUFJyGSZ96lhLiEJlXlt: "datarooms",
    price_1Q8aXWBYvhH6u7U7unPGTnfy: "datarooms",
    price_1QojZuFJyGSZ96lhNwiD1y2r: "datarooms-plus",
    price_1Qw63uBYvhH6u7U7dHVZ0kWZ: "datarooms-plus",
    price_1QojaPFJyGSZ96lhods9TOxh: "datarooms-plus",
    price_1Qw63ABYvhH6u7U7MXK3UOJF: "datarooms-plus",
    price_placeholder_test_old: "datarooms-premium",
    price_1SUWeXBYvhH6u7U7u7CJgsRE: "datarooms-premium",
    price_placeholder_test_yearly_old: "datarooms-premium",
    price_1SUWhQBYvhH6u7U7BE6vVLcf: "datarooms-premium",
  },
};

function getHistoricalPlanFromPriceId(priceId: string, env: string) {
  const planSlug = HISTORICAL_PRICE_IDS[env]?.[priceId];
  if (!planSlug) return null;
  const currentPlan = PLANS.find((plan) => plan.slug === planSlug);
  if (!currentPlan) return null;
  return { ...currentPlan, _historical: true };
}

// ── Types ────────────────────────────────────────────────────────────────────

export type Currency = "eur" | "usd";

export const CURRENCIES: Currency[] = ["eur", "usd"];

export function currencySymbol(c: Currency): string {
  return c === "usd" ? "$" : "€";
}

export type PriceIds = {
  test: { old: string; new: string };
  production: { old: string; new: string };
};

export type CurrencyPrice = {
  amount: number;
  priceIds: PriceIds;
};

export type PerSeatPricing = {
  eur: CurrencyPrice;
  usd: CurrencyPrice;
};

export type PlanPrice = {
  eur: CurrencyPrice;
  usd: CurrencyPrice;
  perSeat?: PerSeatPricing;
};

export type Plan = {
  name: string;
  slug: string;
  includedUsers: number;
  price: {
    monthly: PlanPrice;
    yearly: PlanPrice;
  };
  _historical?: boolean;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

export function planHasDualPricing(plan: Plan): boolean {
  return !!plan.price.monthly.perSeat;
}

export function getPlanFromPriceId(
  priceId: string,
  isOldAccount: boolean = false,
) {
  const env =
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ? "production" : "test";
  const accountType = isOldAccount ? "old" : "new";

  const plan = PLANS.find((plan) => {
    for (const period of ["monthly", "yearly"] as const) {
      for (const cur of CURRENCIES) {
        if (plan.price[period][cur].priceIds[env][accountType] === priceId)
          return true;
        if (
          plan.price[period].perSeat?.[cur].priceIds[env][accountType] ===
          priceId
        )
          return true;
      }
    }
    return false;
  });

  if (!plan) {
    const historicalPlan = getHistoricalPlanFromPriceId(priceId, env);
    if (historicalPlan) {
      console.log(
        `Found historical plan mapping for priceId: ${priceId} -> ${historicalPlan.slug}`,
      );
      return historicalPlan;
    }
    console.error(
      `Plan not found for priceId: ${priceId}, isOldAccount: ${isOldAccount}, env: ${env}`,
    );
    return null;
  }
  return plan;
}

export function isPerSeatPriceId(
  priceId: string,
  isOldAccount: boolean = false,
): boolean {
  const env =
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ? "production" : "test";
  const accountType = isOldAccount ? "old" : "new";
  return PLANS.some((plan) => {
    for (const period of ["monthly", "yearly"] as const) {
      for (const cur of CURRENCIES) {
        if (
          plan.price[period].perSeat?.[cur].priceIds[env][accountType] ===
          priceId
        )
          return true;
      }
    }
    return false;
  });
}

// custom type coercion because Stripe's types are wrong
export function isNewCustomer(
  previousAttributes: Partial<Stripe.Subscription> | undefined,
) {
  let isNewCustomer = false;
  try {
    if (previousAttributes?.default_payment_method === null) {
      isNewCustomer = true;
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
  return isNewCustomer;
}

export function isUpgradedCustomer(
  previousAttributes: Partial<Stripe.Subscription> | undefined,
) {
  let isUpgradedUser = false;
  try {
    if (previousAttributes?.items !== undefined) {
      isUpgradedUser = true;
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
  return isUpgradedUser;
}

// ── Placeholder helper ───────────────────────────────────────────────────────
// TODO: Replace all price_TODO_* values with real Stripe Price IDs.
// For each plan × period × currency (EUR/USD) × account type (old/new), create:
//   1. A FLAT recurring price for the base plan charge
//   2. A PER-UNIT recurring price for additional seats (dual-pricing plans only)
function pid(label: string): string {
  return `price_TODO_${label}`;
}

// ── PLANS ────────────────────────────────────────────────────────────────────

export const PLANS: Plan[] = [
  // ─── Pro (single-price per-user, no per-seat addon) ───────────────────────
  {
    name: "Pro",
    slug: "pro",
    includedUsers: 1,
    price: {
      monthly: {
        eur: {
          amount: 29,
          priceIds: {
            test: { old: "price_1Q3bcHFJyGSZ96lhElXBA5C1", new: "price_1QvgdNBYvhH6u7U7drrXAXM3" },
            production: { old: "price_1P3FK4FJyGSZ96lhD67yF3lj", new: "price_1Qvk3LBYvhH6u7U7JE4V6JY0" },
          },
        },
        usd: {
          amount: 34,
          priceIds: {
            test: { old: pid("PRO_USD_MO_TEST_OLD"), new: pid("PRO_USD_MO_TEST_NEW") },
            production: { old: pid("PRO_USD_MO_PROD_OLD"), new: pid("PRO_USD_MO_PROD_NEW") },
          },
        },
      },
      yearly: {
        eur: {
          amount: 24,
          priceIds: {
            test: { old: "price_1Q3bV9FJyGSZ96lhCYWIcmg5", new: "price_1QviTtBYvhH6u7U79PQ2rzMI" },
            production: { old: "price_1Q3gfNFJyGSZ96lh2jGhEadm", new: "price_1Qvk3LBYvhH6u7U7kppryTjV" },
          },
        },
        usd: {
          amount: 29,
          priceIds: {
            test: { old: pid("PRO_USD_YR_TEST_OLD"), new: pid("PRO_USD_YR_TEST_NEW") },
            production: { old: pid("PRO_USD_YR_PROD_OLD"), new: pid("PRO_USD_YR_PROD_NEW") },
          },
        },
      },
    },
  },

  // ─── Business ─────────────────────────────────────────────────────────────
  {
    name: "Business",
    slug: "business",
    includedUsers: 1,
    price: {
      monthly: {
        eur: { amount: 79, priceIds: { test: { old: pid("BIZ_EUR_BASE_MO_TEST_OLD"), new: pid("BIZ_EUR_BASE_MO_TEST_NEW") }, production: { old: pid("BIZ_EUR_BASE_MO_PROD_OLD"), new: pid("BIZ_EUR_BASE_MO_PROD_NEW") } } },
        usd: { amount: 89, priceIds: { test: { old: pid("BIZ_USD_BASE_MO_TEST_OLD"), new: pid("BIZ_USD_BASE_MO_TEST_NEW") }, production: { old: pid("BIZ_USD_BASE_MO_PROD_OLD"), new: pid("BIZ_USD_BASE_MO_PROD_NEW") } } },
        perSeat: {
          eur: { amount: 26.5, priceIds: { test: { old: pid("BIZ_EUR_SEAT_MO_TEST_OLD"), new: pid("BIZ_EUR_SEAT_MO_TEST_NEW") }, production: { old: pid("BIZ_EUR_SEAT_MO_PROD_OLD"), new: pid("BIZ_EUR_SEAT_MO_PROD_NEW") } } },
          usd: { amount: 30, priceIds: { test: { old: pid("BIZ_USD_SEAT_MO_TEST_OLD"), new: pid("BIZ_USD_SEAT_MO_TEST_NEW") }, production: { old: pid("BIZ_USD_SEAT_MO_PROD_OLD"), new: pid("BIZ_USD_SEAT_MO_PROD_NEW") } } },
        },
      },
      yearly: {
        eur: { amount: 59, priceIds: { test: { old: pid("BIZ_EUR_BASE_YR_TEST_OLD"), new: pid("BIZ_EUR_BASE_YR_TEST_NEW") }, production: { old: pid("BIZ_EUR_BASE_YR_PROD_OLD"), new: pid("BIZ_EUR_BASE_YR_PROD_NEW") } } },
        usd: { amount: 69, priceIds: { test: { old: pid("BIZ_USD_BASE_YR_TEST_OLD"), new: pid("BIZ_USD_BASE_YR_TEST_NEW") }, production: { old: pid("BIZ_USD_BASE_YR_PROD_OLD"), new: pid("BIZ_USD_BASE_YR_PROD_NEW") } } },
        perSeat: {
          eur: { amount: 19, priceIds: { test: { old: pid("BIZ_EUR_SEAT_YR_TEST_OLD"), new: pid("BIZ_EUR_SEAT_YR_TEST_NEW") }, production: { old: pid("BIZ_EUR_SEAT_YR_PROD_OLD"), new: pid("BIZ_EUR_SEAT_YR_PROD_NEW") } } },
          usd: { amount: 22, priceIds: { test: { old: pid("BIZ_USD_SEAT_YR_TEST_OLD"), new: pid("BIZ_USD_SEAT_YR_TEST_NEW") }, production: { old: pid("BIZ_USD_SEAT_YR_PROD_OLD"), new: pid("BIZ_USD_SEAT_YR_PROD_NEW") } } },
        },
      },
    },
  },

  // ─── Data Rooms ───────────────────────────────────────────────────────────
  {
    name: "Data Rooms",
    slug: "datarooms",
    includedUsers: 1,
    price: {
      monthly: {
        eur: { amount: 149, priceIds: { test: { old: pid("DR_EUR_BASE_MO_TEST_OLD"), new: pid("DR_EUR_BASE_MO_TEST_NEW") }, production: { old: pid("DR_EUR_BASE_MO_PROD_OLD"), new: pid("DR_EUR_BASE_MO_PROD_NEW") } } },
        usd: { amount: 179, priceIds: { test: { old: pid("DR_USD_BASE_MO_TEST_OLD"), new: pid("DR_USD_BASE_MO_TEST_NEW") }, production: { old: pid("DR_USD_BASE_MO_PROD_OLD"), new: pid("DR_USD_BASE_MO_PROD_NEW") } } },
        perSeat: {
          eur: { amount: 49, priceIds: { test: { old: pid("DR_EUR_SEAT_MO_TEST_OLD"), new: pid("DR_EUR_SEAT_MO_TEST_NEW") }, production: { old: pid("DR_EUR_SEAT_MO_PROD_OLD"), new: pid("DR_EUR_SEAT_MO_PROD_NEW") } } },
          usd: { amount: 57, priceIds: { test: { old: pid("DR_USD_SEAT_MO_TEST_OLD"), new: pid("DR_USD_SEAT_MO_TEST_NEW") }, production: { old: pid("DR_USD_SEAT_MO_PROD_OLD"), new: pid("DR_USD_SEAT_MO_PROD_NEW") } } },
        },
      },
      yearly: {
        eur: { amount: 99, priceIds: { test: { old: pid("DR_EUR_BASE_YR_TEST_OLD"), new: pid("DR_EUR_BASE_YR_TEST_NEW") }, production: { old: pid("DR_EUR_BASE_YR_PROD_OLD"), new: pid("DR_EUR_BASE_YR_PROD_NEW") } } },
        usd: { amount: 119, priceIds: { test: { old: pid("DR_USD_BASE_YR_TEST_OLD"), new: pid("DR_USD_BASE_YR_TEST_NEW") }, production: { old: pid("DR_USD_BASE_YR_PROD_OLD"), new: pid("DR_USD_BASE_YR_PROD_NEW") } } },
        perSeat: {
          eur: { amount: 33, priceIds: { test: { old: pid("DR_EUR_SEAT_YR_TEST_OLD"), new: pid("DR_EUR_SEAT_YR_TEST_NEW") }, production: { old: pid("DR_EUR_SEAT_YR_PROD_OLD"), new: pid("DR_EUR_SEAT_YR_PROD_NEW") } } },
          usd: { amount: 39, priceIds: { test: { old: pid("DR_USD_SEAT_YR_TEST_OLD"), new: pid("DR_USD_SEAT_YR_TEST_NEW") }, production: { old: pid("DR_USD_SEAT_YR_PROD_OLD"), new: pid("DR_USD_SEAT_YR_PROD_NEW") } } },
        },
      },
    },
  },

  // ─── Data Rooms Plus ──────────────────────────────────────────────────────
  {
    name: "Data Rooms Plus",
    slug: "datarooms-plus",
    includedUsers: 1,
    price: {
      monthly: {
        eur: { amount: 349, priceIds: { test: { old: pid("DRP_EUR_BASE_MO_TEST_OLD"), new: pid("DRP_EUR_BASE_MO_TEST_NEW") }, production: { old: pid("DRP_EUR_BASE_MO_PROD_OLD"), new: pid("DRP_EUR_BASE_MO_PROD_NEW") } } },
        usd: { amount: 399, priceIds: { test: { old: pid("DRP_USD_BASE_MO_TEST_OLD"), new: pid("DRP_USD_BASE_MO_TEST_NEW") }, production: { old: pid("DRP_USD_BASE_MO_PROD_OLD"), new: pid("DRP_USD_BASE_MO_PROD_NEW") } } },
        perSeat: {
          eur: { amount: 69, priceIds: { test: { old: pid("DRP_EUR_SEAT_MO_TEST_OLD"), new: pid("DRP_EUR_SEAT_MO_TEST_NEW") }, production: { old: pid("DRP_EUR_SEAT_MO_PROD_OLD"), new: pid("DRP_EUR_SEAT_MO_PROD_NEW") } } },
          usd: { amount: 79, priceIds: { test: { old: pid("DRP_USD_SEAT_MO_TEST_OLD"), new: pid("DRP_USD_SEAT_MO_TEST_NEW") }, production: { old: pid("DRP_USD_SEAT_MO_PROD_OLD"), new: pid("DRP_USD_SEAT_MO_PROD_NEW") } } },
        },
      },
      yearly: {
        eur: { amount: 249, priceIds: { test: { old: pid("DRP_EUR_BASE_YR_TEST_OLD"), new: pid("DRP_EUR_BASE_YR_TEST_NEW") }, production: { old: pid("DRP_EUR_BASE_YR_PROD_OLD"), new: pid("DRP_EUR_BASE_YR_PROD_NEW") } } },
        usd: { amount: 289, priceIds: { test: { old: pid("DRP_USD_BASE_YR_TEST_OLD"), new: pid("DRP_USD_BASE_YR_TEST_NEW") }, production: { old: pid("DRP_USD_BASE_YR_PROD_OLD"), new: pid("DRP_USD_BASE_YR_PROD_NEW") } } },
        perSeat: {
          eur: { amount: 49, priceIds: { test: { old: pid("DRP_EUR_SEAT_YR_TEST_OLD"), new: pid("DRP_EUR_SEAT_YR_TEST_NEW") }, production: { old: pid("DRP_EUR_SEAT_YR_PROD_OLD"), new: pid("DRP_EUR_SEAT_YR_PROD_NEW") } } },
          usd: { amount: 57, priceIds: { test: { old: pid("DRP_USD_SEAT_YR_TEST_OLD"), new: pid("DRP_USD_SEAT_YR_TEST_NEW") }, production: { old: pid("DRP_USD_SEAT_YR_PROD_OLD"), new: pid("DRP_USD_SEAT_YR_PROD_NEW") } } },
        },
      },
    },
  },

  // ─── Data Rooms Premium ───────────────────────────────────────────────────
  {
    name: "Data Rooms Premium",
    slug: "datarooms-premium",
    includedUsers: 1,
    price: {
      monthly: {
        eur: { amount: 699, priceIds: { test: { old: pid("DRPR_EUR_BASE_MO_TEST_OLD"), new: pid("DRPR_EUR_BASE_MO_TEST_NEW") }, production: { old: pid("DRPR_EUR_BASE_MO_PROD_OLD"), new: pid("DRPR_EUR_BASE_MO_PROD_NEW") } } },
        usd: { amount: 799, priceIds: { test: { old: pid("DRPR_USD_BASE_MO_TEST_OLD"), new: pid("DRPR_USD_BASE_MO_TEST_NEW") }, production: { old: pid("DRPR_USD_BASE_MO_PROD_OLD"), new: pid("DRPR_USD_BASE_MO_PROD_NEW") } } },
        perSeat: {
          eur: { amount: 70, priceIds: { test: { old: pid("DRPR_EUR_SEAT_MO_TEST_OLD"), new: pid("DRPR_EUR_SEAT_MO_TEST_NEW") }, production: { old: pid("DRPR_EUR_SEAT_MO_PROD_OLD"), new: pid("DRPR_EUR_SEAT_MO_PROD_NEW") } } },
          usd: { amount: 80, priceIds: { test: { old: pid("DRPR_USD_SEAT_MO_TEST_OLD"), new: pid("DRPR_USD_SEAT_MO_TEST_NEW") }, production: { old: pid("DRPR_USD_SEAT_MO_PROD_OLD"), new: pid("DRPR_USD_SEAT_MO_PROD_NEW") } } },
        },
      },
      yearly: {
        eur: { amount: 549, priceIds: { test: { old: pid("DRPR_EUR_BASE_YR_TEST_OLD"), new: pid("DRPR_EUR_BASE_YR_TEST_NEW") }, production: { old: pid("DRPR_EUR_BASE_YR_PROD_OLD"), new: pid("DRPR_EUR_BASE_YR_PROD_NEW") } } },
        usd: { amount: 639, priceIds: { test: { old: pid("DRPR_USD_BASE_YR_TEST_OLD"), new: pid("DRPR_USD_BASE_YR_TEST_NEW") }, production: { old: pid("DRPR_USD_BASE_YR_PROD_OLD"), new: pid("DRPR_USD_BASE_YR_PROD_NEW") } } },
        perSeat: {
          eur: { amount: 55, priceIds: { test: { old: pid("DRPR_EUR_SEAT_YR_TEST_OLD"), new: pid("DRPR_EUR_SEAT_YR_TEST_NEW") }, production: { old: pid("DRPR_EUR_SEAT_YR_PROD_OLD"), new: pid("DRPR_EUR_SEAT_YR_PROD_NEW") } } },
          usd: { amount: 65, priceIds: { test: { old: pid("DRPR_USD_SEAT_YR_TEST_OLD"), new: pid("DRPR_USD_SEAT_YR_TEST_NEW") }, production: { old: pid("DRPR_USD_SEAT_YR_PROD_OLD"), new: pid("DRPR_USD_SEAT_YR_PROD_NEW") } } },
        },
      },
    },
  },

  // ─── Data Rooms Unlimited (no per-seat, users are unlimited) ──────────────
  {
    name: "Data Rooms Unlimited",
    slug: "datarooms-unlimited",
    includedUsers: 100,
    price: {
      monthly: {
        eur: { amount: 2800, priceIds: { test: { old: pid("DRU_EUR_BASE_MO_TEST_OLD"), new: pid("DRU_EUR_BASE_MO_TEST_NEW") }, production: { old: pid("DRU_EUR_BASE_MO_PROD_OLD"), new: pid("DRU_EUR_BASE_MO_PROD_NEW") } } },
        usd: { amount: 3199, priceIds: { test: { old: pid("DRU_USD_BASE_MO_TEST_OLD"), new: pid("DRU_USD_BASE_MO_TEST_NEW") }, production: { old: pid("DRU_USD_BASE_MO_PROD_OLD"), new: pid("DRU_USD_BASE_MO_PROD_NEW") } } },
      },
      yearly: {
        eur: { amount: 2800, priceIds: { test: { old: pid("DRU_EUR_BASE_YR_TEST_OLD"), new: pid("DRU_EUR_BASE_YR_TEST_NEW") }, production: { old: pid("DRU_EUR_BASE_YR_PROD_OLD"), new: pid("DRU_EUR_BASE_YR_PROD_NEW") } } },
        usd: { amount: 3199, priceIds: { test: { old: pid("DRU_USD_BASE_YR_TEST_OLD"), new: pid("DRU_USD_BASE_YR_TEST_NEW") }, production: { old: pid("DRU_USD_BASE_YR_PROD_OLD"), new: pid("DRU_USD_BASE_YR_PROD_NEW") } } },
      },
    },
  },
];

export const isOldAccount = (plan: string) => {
  return plan.includes("old");
};
