import { stripeInstance } from "..";
import { isPerSeatPriceId } from "../utils";

export interface SubscriptionDiscount {
  couponId: string;
  percentOff?: number;
  amountOff?: number;
  duration: string;
  durationInMonths?: number;
  valid: boolean;
  end?: number;
}

export interface SubscriptionItems {
  /** The base/plan subscription item ID */
  id: string;
  /** The per-seat addon subscription item ID (only for dual-pricing plans) */
  perSeatId?: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  discount: SubscriptionDiscount | null;
}

export default async function getSubscriptionItem(
  subscriptionId: string,
  isOldAccount: boolean,
): Promise<SubscriptionItems> {
  const stripe = stripeInstance(isOldAccount);
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["discount.coupon"],
  });

  let baseItemId: string | undefined;
  let perSeatItemId: string | undefined;

  for (const item of subscription.items.data) {
    const priceId = item.price.id;
    if (isPerSeatPriceId(priceId, isOldAccount)) {
      perSeatItemId = item.id;
    } else {
      baseItemId = item.id;
    }
  }

  // Fallback: if we couldn't classify items, use the first one as base
  if (!baseItemId && subscription.items.data.length > 0) {
    baseItemId = subscription.items.data[0].id;
  }

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
    id: baseItemId!,
    perSeatId: perSeatItemId,
    currentPeriodStart: subscription.current_period_start,
    currentPeriodEnd: subscription.current_period_end,
    discount,
  };
}
