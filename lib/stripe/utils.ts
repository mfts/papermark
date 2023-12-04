import type Stripe from "stripe";

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
  previousAttributes: // Stripe.Event.Data.PreviousAttributes | undefined
  | {
        default_payment_method?: string;
        items?: {
          data?: {
            price?: {
              id?: string;
            }[];
          };
        };
      }
    | undefined,
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

export const PLANS = [
  {
    name: "Pro",
    slug: "pro",
    price: {
      monthly: {
        amount: 30,
        priceIds: {
          test: "price_1OJFd8FJyGSZ96lh3v4jW7Bf",
          production: "price_1OJTUNFJyGSZ96lhOqTkCxkY",
        },
      },
      yearly: {
        amount: 300,
        priceIds: {
          test: "price_1OJFd8FJyGSZ96lhVmparJSc",
          production: "price_1OJTUNFJyGSZ96lhDxXgXm1e",
        },
      },
    },
  },
  {
    name: "Starter",
    slug: "starter",
    price: {
      monthly: {
        amount: 15,
        priceIds: {
          test: "price_1OIsDmFJyGSZ96lh2aIhaerk",
          production: "price_1OJTUWFJyGSZ96lhTcJPVBgS",
        },
      },
      yearly: {
        amount: 150,
        priceIds: {
          test: "price_1OIsDmFJyGSZ96lhVOYVN8PN",
          production: "price_1OJTUWFJyGSZ96lhGnKb3E9F",
        },
      },
    },
  },
];
