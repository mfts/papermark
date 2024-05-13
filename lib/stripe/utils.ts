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
          test: "price_1P3JdWFJyGSZ96lhLqX6drHK",
          production: "price_1P3FK4FJyGSZ96lhD67yF3lj",
        },
      },
      yearly: {
        amount: 25,
        priceIds: {
          test: "price_1P3JlWFJyGSZ96lhddEsPKGg",
          production: "price_1P6VTgFJyGSZ96lhshdgZ1it",
        },
      },
    },
  },
  {
    name: "Business",
    slug: "business",
    price: {
      monthly: {
        amount: 79,
        priceIds: {
          test: "price_1OuYgCFJyGSZ96lhF2gFs7Rs",
          production: "price_1OuYeIFJyGSZ96lhwH58Y1kU",
        },
      },
      yearly: {
        amount: 59,
        priceIds: {
          test: "price_1OuYgPFJyGSZ96lhKk6JzTf1",
          production: "price_1P6VnoFJyGSZ96lhgFscsQ61",
        },
      },
    },
  },
  {
    name: "Data Rooms",
    slug: "datarooms",
    price: {
      monthly: {
        amount: 199,
        priceIds: {
          test: "price_1PAtTfFJyGSZ96lhbi4XZU2d",
          production: "price_1PAtQOFJyGSZ96lhJNZO2LHx",
        },
      },
      yearly: {
        amount: 149,
        priceIds: {
          test: "price_1PCNRrFJyGSZ96lhQopJJ5cg",
          production: "price_1PCL2GFJyGSZ96lhetYPDN05",
        },
      },
    },
  },
];
