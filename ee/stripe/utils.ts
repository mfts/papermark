import Stripe from "stripe";

// Historical price IDs that are no longer in the main PLANS configuration
// but still need to be supported for existing subscriptions.
// This includes the old per-user price IDs from before the dual-pricing refactor.
const HISTORICAL_PRICE_IDS: Record<string, Record<string, string>> = {
  production: {
    price_1OuYeIFJyGSZ96lhwH58Y1kU: "business",
    // Legacy per-user price IDs (pre dual-pricing refactor)
    price_1Q3gbVFJyGSZ96lhf7hsZciQ: "business", // old account monthly
    price_1Q8egwBYvhH6u7U7XKLGjgHL: "business", // new account monthly
    price_1Q3gbVFJyGSZ96lhqqLhBNDv: "business", // old account yearly
    price_1Q8egwBYvhH6u7U7wRU6iPcW: "business", // new account yearly
    price_1Q3gbbFJyGSZ96lhvmEwjZtm: "datarooms", // old account monthly
    price_1Q8egzBYvhH6u7U7IQUGzwoZ: "datarooms", // new account monthly
    price_1Q3gbbFJyGSZ96lhnk1CtnIZ: "datarooms", // old account yearly
    price_1Q8egzBYvhH6u7U7M2uoROMa: "datarooms", // new account yearly
    price_1QwMmmFJyGSZ96lhhaDXmzkY: "datarooms-plus", // old account monthly
    price_1QwMkABYvhH6u7U74ccUfWkq: "datarooms-plus", // new account monthly
    price_1QwMmeFJyGSZ96lh934mFNPA: "datarooms-plus", // old account yearly
    price_1QwMjABYvhH6u7U7ccxGJXKN: "datarooms-plus", // new account yearly
    price_placeholder_prod_old: "datarooms-premium",
    price_1SUWXqBYvhH6u7U7SJKKOCKU: "datarooms-premium",
    price_placeholder_prod_yearly_old: "datarooms-premium",
    price_1SUWWqBYvhH6u7U7I5MpZ43K: "datarooms-premium",
  },
  test: {
    // Legacy per-user price IDs (pre dual-pricing refactor)
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
  if (!planSlug) {
    return null;
  }

  const currentPlan = PLANS.find((plan) => plan.slug === planSlug);
  if (!currentPlan) {
    return null;
  }

  return {
    ...currentPlan,
    _historical: true,
  };
}

export type PriceIds = {
  test: { old: string; new: string };
  production: { old: string; new: string };
};

export type PlanPrice = {
  amount: number;
  priceIds: PriceIds;
  perSeat?: {
    amount: number;
    priceIds: PriceIds;
  };
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

/**
 * Returns true if the plan uses dual pricing (flat base + per-seat addon).
 * Plans with perSeat pricing show a flat base charge on the invoice
 * instead of a confusing per-user × quantity line item.
 */
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
  const plan = PLANS.find(
    (plan) =>
      plan.price.monthly.priceIds[env][accountType] === priceId ||
      plan.price.yearly.priceIds[env][accountType] === priceId ||
      plan.price.monthly.perSeat?.priceIds[env][accountType] === priceId ||
      plan.price.yearly.perSeat?.priceIds[env][accountType] === priceId,
  );

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

/**
 * Checks if a given priceId is a per-seat addon price (not a base price).
 */
export function isPerSeatPriceId(
  priceId: string,
  isOldAccount: boolean = false,
): boolean {
  const env =
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ? "production" : "test";
  const accountType = isOldAccount ? "old" : "new";
  return PLANS.some(
    (plan) =>
      plan.price.monthly.perSeat?.priceIds[env][accountType] === priceId ||
      plan.price.yearly.perSeat?.priceIds[env][accountType] === priceId,
  );
}

// custom type coercion because Stripe's types are wrong
export function isNewCustomer(
  previousAttributes: Partial<Stripe.Subscription> | undefined,
) {
  let isNewCustomer = false;
  try {
    if (
      // if the user is upgrading from free to pro
      previousAttributes?.default_payment_method === null
    ) {
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
    if (
      // if user has items in their subscription
      previousAttributes?.items !== undefined
    ) {
      isUpgradedUser = true;
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
  return isUpgradedUser;
}

// TODO: Create the following Stripe Prices before going live:
//
// For each plan with dual pricing (Business, Data Rooms, DR Plus, DR Premium):
//   1. A FLAT recurring price for the base plan (not per-unit)
//      - e.g. Business Monthly: €79/mo flat
//   2. A PER-UNIT recurring price for additional seats
//      - e.g. Business Monthly: €26.50/mo per unit
//
// Replace the price_TODO_* placeholders below with real Stripe Price IDs.
// The old per-user price IDs have been moved to HISTORICAL_PRICE_IDS for
// backward compatibility with existing subscriptions.

export const PLANS: Plan[] = [
  {
    name: "Pro",
    slug: "pro",
    includedUsers: 1,
    price: {
      monthly: {
        amount: 29,
        priceIds: {
          test: {
            old: "price_1Q3bcHFJyGSZ96lhElXBA5C1",
            new: "price_1QvgdNBYvhH6u7U7drrXAXM3",
          },
          production: {
            old: "price_1P3FK4FJyGSZ96lhD67yF3lj",
            new: "price_1Qvk3LBYvhH6u7U7JE4V6JY0",
          },
        },
      },
      yearly: {
        amount: 24,
        priceIds: {
          test: {
            old: "price_1Q3bV9FJyGSZ96lhCYWIcmg5",
            new: "price_1QviTtBYvhH6u7U79PQ2rzMI",
          },
          production: {
            old: "price_1Q3gfNFJyGSZ96lh2jGhEadm",
            new: "price_1Qvk3LBYvhH6u7U7kppryTjV",
          },
        },
      },
    },
  },
  {
    name: "Business",
    slug: "business",
    includedUsers: 1,
    price: {
      monthly: {
        amount: 79,
        priceIds: {
          test: {
            old: "price_TODO_BUSINESS_BASE_MONTHLY_TEST_OLD",
            new: "price_TODO_BUSINESS_BASE_MONTHLY_TEST_NEW",
          },
          production: {
            old: "price_TODO_BUSINESS_BASE_MONTHLY_PROD_OLD",
            new: "price_TODO_BUSINESS_BASE_MONTHLY_PROD_NEW",
          },
        },
        perSeat: {
          amount: 26.5,
          priceIds: {
            test: {
              old: "price_TODO_BUSINESS_SEAT_MONTHLY_TEST_OLD",
              new: "price_TODO_BUSINESS_SEAT_MONTHLY_TEST_NEW",
            },
            production: {
              old: "price_TODO_BUSINESS_SEAT_MONTHLY_PROD_OLD",
              new: "price_TODO_BUSINESS_SEAT_MONTHLY_PROD_NEW",
            },
          },
        },
      },
      yearly: {
        amount: 59,
        priceIds: {
          test: {
            old: "price_TODO_BUSINESS_BASE_YEARLY_TEST_OLD",
            new: "price_TODO_BUSINESS_BASE_YEARLY_TEST_NEW",
          },
          production: {
            old: "price_TODO_BUSINESS_BASE_YEARLY_PROD_OLD",
            new: "price_TODO_BUSINESS_BASE_YEARLY_PROD_NEW",
          },
        },
        perSeat: {
          amount: 19,
          priceIds: {
            test: {
              old: "price_TODO_BUSINESS_SEAT_YEARLY_TEST_OLD",
              new: "price_TODO_BUSINESS_SEAT_YEARLY_TEST_NEW",
            },
            production: {
              old: "price_TODO_BUSINESS_SEAT_YEARLY_PROD_OLD",
              new: "price_TODO_BUSINESS_SEAT_YEARLY_PROD_NEW",
            },
          },
        },
      },
    },
  },
  {
    name: "Data Rooms",
    slug: "datarooms",
    includedUsers: 1,
    price: {
      monthly: {
        amount: 149,
        priceIds: {
          test: {
            old: "price_TODO_DATAROOMS_BASE_MONTHLY_TEST_OLD",
            new: "price_TODO_DATAROOMS_BASE_MONTHLY_TEST_NEW",
          },
          production: {
            old: "price_TODO_DATAROOMS_BASE_MONTHLY_PROD_OLD",
            new: "price_TODO_DATAROOMS_BASE_MONTHLY_PROD_NEW",
          },
        },
        perSeat: {
          amount: 49,
          priceIds: {
            test: {
              old: "price_TODO_DATAROOMS_SEAT_MONTHLY_TEST_OLD",
              new: "price_TODO_DATAROOMS_SEAT_MONTHLY_TEST_NEW",
            },
            production: {
              old: "price_TODO_DATAROOMS_SEAT_MONTHLY_PROD_OLD",
              new: "price_TODO_DATAROOMS_SEAT_MONTHLY_PROD_NEW",
            },
          },
        },
      },
      yearly: {
        amount: 99,
        priceIds: {
          test: {
            old: "price_TODO_DATAROOMS_BASE_YEARLY_TEST_OLD",
            new: "price_TODO_DATAROOMS_BASE_YEARLY_TEST_NEW",
          },
          production: {
            old: "price_TODO_DATAROOMS_BASE_YEARLY_PROD_OLD",
            new: "price_TODO_DATAROOMS_BASE_YEARLY_PROD_NEW",
          },
        },
        perSeat: {
          amount: 33,
          priceIds: {
            test: {
              old: "price_TODO_DATAROOMS_SEAT_YEARLY_TEST_OLD",
              new: "price_TODO_DATAROOMS_SEAT_YEARLY_TEST_NEW",
            },
            production: {
              old: "price_TODO_DATAROOMS_SEAT_YEARLY_PROD_OLD",
              new: "price_TODO_DATAROOMS_SEAT_YEARLY_PROD_NEW",
            },
          },
        },
      },
    },
  },
  {
    name: "Data Rooms Plus",
    slug: "datarooms-plus",
    includedUsers: 1,
    price: {
      monthly: {
        amount: 349,
        priceIds: {
          test: {
            old: "price_TODO_DRPLUS_BASE_MONTHLY_TEST_OLD",
            new: "price_TODO_DRPLUS_BASE_MONTHLY_TEST_NEW",
          },
          production: {
            old: "price_TODO_DRPLUS_BASE_MONTHLY_PROD_OLD",
            new: "price_TODO_DRPLUS_BASE_MONTHLY_PROD_NEW",
          },
        },
        perSeat: {
          amount: 69,
          priceIds: {
            test: {
              old: "price_TODO_DRPLUS_SEAT_MONTHLY_TEST_OLD",
              new: "price_TODO_DRPLUS_SEAT_MONTHLY_TEST_NEW",
            },
            production: {
              old: "price_TODO_DRPLUS_SEAT_MONTHLY_PROD_OLD",
              new: "price_TODO_DRPLUS_SEAT_MONTHLY_PROD_NEW",
            },
          },
        },
      },
      yearly: {
        amount: 249,
        priceIds: {
          test: {
            old: "price_TODO_DRPLUS_BASE_YEARLY_TEST_OLD",
            new: "price_TODO_DRPLUS_BASE_YEARLY_TEST_NEW",
          },
          production: {
            old: "price_TODO_DRPLUS_BASE_YEARLY_PROD_OLD",
            new: "price_TODO_DRPLUS_BASE_YEARLY_PROD_NEW",
          },
        },
        perSeat: {
          amount: 49,
          priceIds: {
            test: {
              old: "price_TODO_DRPLUS_SEAT_YEARLY_TEST_OLD",
              new: "price_TODO_DRPLUS_SEAT_YEARLY_TEST_NEW",
            },
            production: {
              old: "price_TODO_DRPLUS_SEAT_YEARLY_PROD_OLD",
              new: "price_TODO_DRPLUS_SEAT_YEARLY_PROD_NEW",
            },
          },
        },
      },
    },
  },
  {
    name: "Data Rooms Premium",
    slug: "datarooms-premium",
    includedUsers: 1,
    price: {
      monthly: {
        amount: 699,
        priceIds: {
          test: {
            old: "price_TODO_DRPREMIUM_BASE_MONTHLY_TEST_OLD",
            new: "price_TODO_DRPREMIUM_BASE_MONTHLY_TEST_NEW",
          },
          production: {
            old: "price_TODO_DRPREMIUM_BASE_MONTHLY_PROD_OLD",
            new: "price_TODO_DRPREMIUM_BASE_MONTHLY_PROD_NEW",
          },
        },
        perSeat: {
          amount: 70,
          priceIds: {
            test: {
              old: "price_TODO_DRPREMIUM_SEAT_MONTHLY_TEST_OLD",
              new: "price_TODO_DRPREMIUM_SEAT_MONTHLY_TEST_NEW",
            },
            production: {
              old: "price_TODO_DRPREMIUM_SEAT_MONTHLY_PROD_OLD",
              new: "price_TODO_DRPREMIUM_SEAT_MONTHLY_PROD_NEW",
            },
          },
        },
      },
      yearly: {
        amount: 549,
        priceIds: {
          test: {
            old: "price_TODO_DRPREMIUM_BASE_YEARLY_TEST_OLD",
            new: "price_TODO_DRPREMIUM_BASE_YEARLY_TEST_NEW",
          },
          production: {
            old: "price_TODO_DRPREMIUM_BASE_YEARLY_PROD_OLD",
            new: "price_TODO_DRPREMIUM_BASE_YEARLY_PROD_NEW",
          },
        },
        perSeat: {
          amount: 55,
          priceIds: {
            test: {
              old: "price_TODO_DRPREMIUM_SEAT_YEARLY_TEST_OLD",
              new: "price_TODO_DRPREMIUM_SEAT_YEARLY_TEST_NEW",
            },
            production: {
              old: "price_TODO_DRPREMIUM_SEAT_YEARLY_PROD_OLD",
              new: "price_TODO_DRPREMIUM_SEAT_YEARLY_PROD_NEW",
            },
          },
        },
      },
    },
  },
];

export const isOldAccount = (plan: string) => {
  return plan.includes("old");
};
