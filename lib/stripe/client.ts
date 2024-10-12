// Stripe Client SDK
import { Stripe as StripeProps, loadStripe } from "@stripe/stripe-js";

let stripePromise: Promise<StripeProps | null>;

export const getStripe = (account: boolean = false) => {
  if (!stripePromise) {
    if (account) {
      stripePromise = loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE_OLD ??
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_OLD ??
          "",
        {
          apiVersion: "2024-06-20",
        },
      );
    } else {
      stripePromise = loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE ??
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
          "",
        {
          apiVersion: "2024-06-20",
        },
      );
    }
  }

  return stripePromise;
};
