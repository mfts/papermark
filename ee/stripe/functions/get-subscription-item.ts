import { stripeInstance } from "..";

export interface SubscriptionDiscount {
  couponId: string;
  percentOff?: number;
  amountOff?: number;
  duration: string;
  durationInMonths?: number;
  valid: boolean;
  end?: number;
}

export default async function getSubscriptionItem(
  subscriptionId: string,
  isOldAccount: boolean,
) {
  const stripe = stripeInstance(isOldAccount);
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["discount.coupon"],
  });
  const subscriptionItem = subscription.items.data[0];

  // Extract discount information if available
  let discount: SubscriptionDiscount | null = null;
  if (subscription.discount && subscription.discount.coupon) {
    const coupon = subscription.discount.coupon;
    discount = {
      couponId: coupon.id,
      percentOff: coupon.percent_off || undefined,
      amountOff: coupon.amount_off || undefined,
      duration: coupon.duration,
      durationInMonths: coupon.duration_in_months || undefined,
      valid: coupon.valid,
      end: subscription.discount.end || undefined,
    };
  }

  return {
    id: subscriptionItem.id,
    currentPeriodStart: subscription.current_period_start,
    currentPeriodEnd: subscription.current_period_end,
    discount,
  };
}
