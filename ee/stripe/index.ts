import Stripe from "stripe";

const stripeOld = new Stripe(
  process.env.STRIPE_SECRET_KEY_LIVE_OLD ??
    process.env.STRIPE_SECRET_KEY_OLD ??
    "",
  {
    apiVersion: "2024-06-20",
    appInfo: {
      name: "Papermark.io",
      version: "0.1.0",
    },
    typescript: true,
  },
);

const stripeNew = new Stripe(
  process.env.STRIPE_SECRET_KEY_LIVE ?? process.env.STRIPE_SECRET_KEY ?? "",
  {
    apiVersion: "2024-06-20",
    appInfo: {
      name: "Papermark.io",
      version: "0.1.0",
    },
    typescript: true,
  },
);

export const stripeInstance = (account: boolean = false) => {
  return account ? stripeOld : stripeNew;
};

export async function cancelSubscription(
  customer?: string,
  isOldAccount: boolean = false,
) {
  if (!customer) return;

  try {
    const stripe = stripeInstance(isOldAccount);
    const subscriptionId = await stripe.subscriptions
      .list({
        customer,
      })
      .then((res) => res.data[0].id);

    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
      cancellation_details: {
        comment: "Customer deleted their Papermark instance.",
      },
    });
  } catch (error) {
    return;
  }
}
