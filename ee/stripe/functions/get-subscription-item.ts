import { stripeInstance } from "..";

export default async function getSubscriptionItem(
  subscriptionId: string,
  isOldAccount: boolean,
) {
  const stripe = stripeInstance(isOldAccount);
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const subscriptionItemId = subscription.items.data[0].id;
  return subscriptionItemId;
}
