import Stripe from "stripe";

// Historical price IDs that are no longer in the main PLANS configuration
// but still need to be supported for existing subscriptions
const HISTORICAL_PRICE_IDS: Record<string, Record<string, string>> = {
  production: {
    // Business plan historical prices
    price_1OuYeIFJyGSZ96lhwH58Y1kU: "business", // Old business plan
    // Add more historical price IDs here as needed
  },
  test: {
    // Add test environment historical price IDs if needed
  },
};

function getHistoricalPlanFromPriceId(priceId: string, env: string) {
  const planSlug = HISTORICAL_PRICE_IDS[env]?.[priceId];
  if (!planSlug) {
    return null;
  }

  // Find the current plan configuration for this slug
  const currentPlan = PLANS.find((plan) => plan.slug === planSlug);
  if (!currentPlan) {
    return null;
  }

  // Return a plan object that maintains the current plan structure
  // but indicates it's from a historical price ID
  return {
    ...currentPlan,
    // Mark this as a historical price for logging purposes
    _historical: true,
  };
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
      plan.price.yearly.priceIds[env][accountType] === priceId,
  );

  if (!plan) {
    // Check historical price IDs for known legacy prices
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
    // Return null instead of a fake free plan to prevent unintended downgrades
    return null;
  }

  return plan;
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

export const PLANS = [
  {
    name: "Pro",
    slug: "pro",
    minQuantity: 1,
    price: {
      monthly: {
        amount: 29,
        unitPrice: 1950,
        priceIds: {
          test: {
            old: "price_1Q3bcHFJyGSZ96lhElXBA5C1",
            // new: "price_1Q8aUBBYvhH6u7U7LPIVxYpz",
            new: "price_1QvgdNBYvhH6u7U7drrXAXM3", // exp
          },
          production: {
            old: "price_1P3FK4FJyGSZ96lhD67yF3lj",
            // new: "price_1Q8egtBYvhH6u7U7gq1Pbp5Z",
            new: "price_1Qvk3LBYvhH6u7U7JE4V6JY0", // exp
          },
        },
      },
      yearly: {
        amount: 24,
        unitPrice: 1450,
        priceIds: {
          test: {
            old: "price_1Q3bV9FJyGSZ96lhCYWIcmg5",
            // new: "price_1Q8aTkBYvhH6u7U7kUiNTSLX",
            new: "price_1QviTtBYvhH6u7U79PQ2rzMI", // exp
          },
          production: {
            old: "price_1Q3gfNFJyGSZ96lh2jGhEadm",
            // new: "price_1Q8egtBYvhH6u7U7T4ehn7SM",
            new: "price_1Qvk3LBYvhH6u7U7kppryTjV", // exp
          },
        },
      },
    },
  },
  {
    name: "Business",
    slug: "business",
    minQuantity: 3,
    price: {
      monthly: {
        amount: 79,
        unitPrice: 2633,
        priceIds: {
          test: {
            old: "price_1Q3bPhFJyGSZ96lhnxpiJMwz",
            new: "price_1Q8aWlBYvhH6u7U7gTeKJJ0Y",
          },
          production: {
            old: "price_1Q3gbVFJyGSZ96lhf7hsZciQ",
            new: "price_1Q8egwBYvhH6u7U7XKLGjgHL",
          },
        },
      },
      yearly: {
        amount: 59,
        unitPrice: 1967,
        priceIds: {
          test: {
            old: "price_1Q3bQ5FJyGSZ96lhoS8QbYXr",
            new: "price_1Q8aVSBYvhH6u7U72mn6iPfK",
          },
          production: {
            old: "price_1Q3gbVFJyGSZ96lhqqLhBNDv",
            new: "price_1Q8egwBYvhH6u7U7wRU6iPcW",
          },
        },
      },
    },
  },
  {
    name: "Data Rooms",
    slug: "datarooms",
    minQuantity: 3,
    baseUsers: 3, // Users included in base price
    price: {
      monthly: {
        amount: 149, // Base price for 3 users
        unitPrice: 4900, // Additional user price (€49/month)
        basePriceIds: { // Base price product IDs
          test: {
            old: "price_1Q3bHPFJyGSZ96lhpQD0lMdU",
            new: "price_1Q8aYLBYvhH6u7U7RUqHnsBh",
          },
          production: {
            old: "price_1Q3gbbFJyGSZ96lhvmEwjZtm",
            new: "price_1Q8egzBYvhH6u7U7IQUGzwoZ",
          },
        },
        priceIds: { // Keep for backward compatibility
          test: {
            old: "price_1Q3bHPFJyGSZ96lhpQD0lMdU",
            new: "price_1Q8aYLBYvhH6u7U7RUqHnsBh",
          },
          production: {
            old: "price_1Q3gbbFJyGSZ96lhvmEwjZtm",
            new: "price_1Q8egzBYvhH6u7U7IQUGzwoZ",
          },
        },
        additionalUserPriceIds: { // Additional user price product IDs (to be created)
          test: {
            old: "price_datarooms_additional_user_monthly_test_old",
            new: "price_datarooms_additional_user_monthly_test_new",
          },
          production: {
            old: "price_datarooms_additional_user_monthly_prod_old",
            new: "price_datarooms_additional_user_monthly_prod_new",
          },
        },
      },
      yearly: {
        amount: 99, // Base price for 3 users
        unitPrice: 3300, // Additional user price (€33/month, €396/year)
        basePriceIds: { // Base price product IDs
          test: {
            old: "price_1Q3bJUFJyGSZ96lhLiEJlXlt",
            new: "price_1Q8aXWBYvhH6u7U7unPGTnfy",
          },
          production: {
            old: "price_1Q3gbbFJyGSZ96lhnk1CtnIZ",
            new: "price_1Q8egzBYvhH6u7U7M2uoROMa",
          },
        },
        priceIds: { // Keep for backward compatibility
          test: {
            old: "price_1Q3bJUFJyGSZ96lhLiEJlXlt",
            new: "price_1Q8aXWBYvhH6u7U7unPGTnfy",
          },
          production: {
            old: "price_1Q3gbbFJyGSZ96lhnk1CtnIZ",
            new: "price_1Q8egzBYvhH6u7U7M2uoROMa",
          },
        },
        additionalUserPriceIds: { // Additional user price product IDs (to be created)
          test: {
            old: "price_datarooms_additional_user_yearly_test_old",
            new: "price_datarooms_additional_user_yearly_test_new",
          },
          production: {
            old: "price_datarooms_additional_user_yearly_prod_old",
            new: "price_datarooms_additional_user_yearly_prod_new",
          },
        },
      },
    },
  },
  {
    name: "Data Rooms Plus",
    slug: "datarooms-plus",
    minQuantity: 5,
    baseUsers: 5, // Users included in base price
    price: {
      monthly: {
        amount: 349, // Base price for 5 users
        unitPrice: 6900, // Additional user price (€69/month)
        basePriceIds: { // Base price product IDs
          test: {
            old: "price_1QojZuFJyGSZ96lhNwiD1y2r",
            new: "price_1Qw63uBYvhH6u7U7dHVZ0kWZ",
          },
          production: {
            old: "price_1QwMmmFJyGSZ96lhhaDXmzkY",
            new: "price_1QwMkABYvhH6u7U74ccUfWkq",
          },
        },
        priceIds: { // Keep for backward compatibility
          test: {
            old: "price_1QojZuFJyGSZ96lhNwiD1y2r",
            new: "price_1Qw63uBYvhH6u7U7dHVZ0kWZ",
          },
          production: {
            old: "price_1QwMmmFJyGSZ96lhhaDXmzkY",
            new: "price_1QwMkABYvhH6u7U74ccUfWkq",
          },
        },
        additionalUserPriceIds: { // Additional user price product IDs (to be created)
          test: {
            old: "price_datarooms_plus_additional_user_monthly_test_old",
            new: "price_datarooms_plus_additional_user_monthly_test_new",
          },
          production: {
            old: "price_datarooms_plus_additional_user_monthly_prod_old",
            new: "price_datarooms_plus_additional_user_monthly_prod_new",
          },
        },
      },
      yearly: {
        amount: 249, // Base price for 5 users
        unitPrice: 4900, // Additional user price (€49/month, €588/year)
        basePriceIds: { // Base price product IDs
          test: {
            old: "price_1QojaPFJyGSZ96lhods9TOxh",
            new: "price_1Qw63ABYvhH6u7U7MXK3UOJF",
          },
          production: {
            old: "price_1QwMmeFJyGSZ96lh934mFNPA",
            new: "price_1QwMjABYvhH6u7U7ccxGJXKN",
          },
        },
        priceIds: { // Keep for backward compatibility
          test: {
            old: "price_1QojaPFJyGSZ96lhods9TOxh",
            new: "price_1Qw63ABYvhH6u7U7MXK3UOJF",
          },
          production: {
            old: "price_1QwMmeFJyGSZ96lh934mFNPA",
            new: "price_1QwMjABYvhH6u7U7ccxGJXKN",
          },
        },
        additionalUserPriceIds: { // Additional user price product IDs (to be created)
          test: {
            old: "price_datarooms_plus_additional_user_yearly_test_old",
            new: "price_datarooms_plus_additional_user_yearly_test_new",
          },
          production: {
            old: "price_datarooms_plus_additional_user_yearly_prod_old",
            new: "price_datarooms_plus_additional_user_yearly_prod_new",
          },
        },
      },
    },
  },
];

export const isOldAccount = (plan: string) => {
  return plan.includes("old");
};
