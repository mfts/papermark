import Stripe from "stripe";

export function getPlanFromPriceId(priceId: string) {
  const env =
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ? "production" : "test";
  return PLANS.find(
    (plan) =>
      plan.price.monthly.priceIds[env] === priceId ||
      plan.price.yearly.priceIds[env] === priceId,
  )!;
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
    price: {
      monthly: {
        amount: 39,
        priceIds: {
          test: "price_1Q3bcHFJyGSZ96lhElXBA5C1",
          production: "price_1P3FK4FJyGSZ96lhD67yF3lj",
        },
      },
      yearly: {
        amount: 29,
        priceIds: {
          test: "price_1Q3bV9FJyGSZ96lhCYWIcmg5",
          production: "price_1Q3gfNFJyGSZ96lh2jGhEadm",
        },
      },
    },
  },
  // {
  //   name: "Pro with Custom Domain",
  //   price: {
  //     monthly: {
  //       amount: 59,
  //       priceIds: {
  //         test: "price_1Q05u4FJyGSZ96lhDFRzhFgj",
  //         production: "price_prod_id_pro_custom_domain_monthly",
  //       },
  //     },
  //     yearly: {
  //       amount: 49,
  //       priceIds: {
  //         test: "price_1Q16E9FJyGSZ96lhhepSttFn",
  //         production: "price_prod_id_pro_custom_domain_yearly",
  //       },
  //     },
  //   },
  // },
  {
    name: "Business",
    slug: "business",
    price: {
      monthly: {
        amount: 79,
        priceIds: {
          test: "price_1Q3bPhFJyGSZ96lhnxpiJMwz",
          production: "price_1Q3gbVFJyGSZ96lhf7hsZciQ",
        },
      },
      yearly: {
        amount: 59,
        priceIds: {
          test: "price_1Q3bQ5FJyGSZ96lhoS8QbYXr",
          production: "price_1Q3gbVFJyGSZ96lhqqLhBNDv",
        },
      },
    },
  },
  // {
  //   name: "Business with Custom Domain",
  //   price: {
  //     monthly: {
  //       amount: 109,
  //       priceIds: {
  //         test: "price_1Q16CLFJyGSZ96lhYxMLSJm0",
  //         production: "price_prod_id_pro_custom_domain_monthly",
  //       },
  //     },
  //     yearly: {
  //       amount: 79,
  //       priceIds: {
  //         test: "price_1Q16DHFJyGSZ96lhDxFnXdNh",
  //         production: "price_prod_id_pro_custom_domain_yearly",
  //       },
  //     },
  //   },
  // },
  {
    name: "Data Rooms",
    slug: "datarooms",
    price: {
      monthly: {
        amount: 149,
        priceIds: {
          test: "price_1Q3bHPFJyGSZ96lhpQD0lMdU",
          production: "price_1Q3gbbFJyGSZ96lhvmEwjZtm",
        },
      },
      yearly: {
        amount: 99,
        priceIds: {
          test: "price_1Q3bJUFJyGSZ96lhLiEJlXlt",
          production: "price_1Q3gbbFJyGSZ96lhnk1CtnIZ",
        },
      },
    },
  },
];
