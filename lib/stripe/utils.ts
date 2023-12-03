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
        amount: 29,
        priceIds: {
          test: "price_1NmHGzFJyGSZ96lhp946ODFI",
          production: "price_1NmMZ7FJyGSZ96lhyad2LW90",
        },
      },
      yearly: {
        amount: 290,
        priceIds: {
          test: "price_1NmHHaFJyGSZ96lhXxg2fTr7",
          production: "price_1NmMZ7FJyGSZ96lhqZEkh50e",
        },
      },
    },
  },
];
