import { NextApiRequest, NextApiResponse } from "next";

import { stripeInstance } from "@/ee/stripe";
import { getCouponFromPlan } from "@/ee/stripe/functions/get-coupon-from-plan";
import getSubscriptionItem from "@/ee/stripe/functions/get-subscription-item";
import {
  getPlanFromPriceId,
  isOldAccount,
  planHasDualPricing,
} from "@/ee/stripe/utils";
import { waitUntil } from "@vercel/functions";
import { getServerSession } from "next-auth/next";

import { identifyUser, trackAnalytics } from "@/lib/analytics";
import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../../../auth/[...nextauth]";

export const config = {
  supportsResponseStreaming: true,
};

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const userId = (session.user as CustomUser).id;
    const userEmail = (session.user as CustomUser).email;

    const { teamId } = req.query as { teamId: string };
    const {
      priceId,
      perSeatPriceId,
      upgradePlan,
      quantity,
      addSeat,
      proAnnualBanner,
      return_url,
      applyYearlyDiscount,
      type = "manage",
    } = req.body as {
      priceId: string;
      perSeatPriceId?: string;
      upgradePlan: boolean;
      quantity?: number;
      addSeat?: boolean;
      proAnnualBanner?: boolean;
      return_url?: string;
      applyYearlyDiscount?: boolean;
      type?:
        | "manage"
        | "invoices"
        | "subscription_update"
        | "payment_method_update"
        | "cancellation";
    };
    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId: userId,
            },
          },
        },
        select: {
          stripeId: true,
          subscriptionId: true,
          plan: true,
        },
      });

      if (!team) {
        return res.status(400).json({ error: "Team does not exists" });
      }
      if (!team.stripeId) {
        return res.status(400).json({ error: "No Stripe customer ID" });
      }

      if (!team.subscriptionId) {
        return res.status(400).json({ error: "No subscription ID" });
      }

      const subscriptionData = await getSubscriptionItem(
        team.subscriptionId,
        isOldAccount(team.plan),
      );

      const stripe = stripeInstance(isOldAccount(team.plan));

      if (applyYearlyDiscount && upgradePlan) {
        const plan = getPlanFromPriceId(priceId, isOldAccount(team.plan));
        if (plan) {
          const planString = `${plan.slug}${isOldAccount(team.plan) ? "+old" : ""}`;
          const couponId = getCouponFromPlan(planString, true);

          try {
            await stripe.coupons.retrieve(couponId);
            await stripe.subscriptions.update(team.subscriptionId, {
              discounts: [{ coupon: couponId }],
            });
          } catch (error: any) {
            if (error.code === "resource_missing") {
              console.warn(
                `[Manage] Coupon "${couponId}" not found in ${process.env.NEXT_PUBLIC_VERCEL_ENV || "test"} mode. Skipping.`,
              );
            } else {
              throw error;
            }
          }
        }
      }

      // Build subscription update items for billing portal
      let updateItems: Array<{
        id: string;
        quantity: number;
        price: string;
      }> = [];

      const plan = priceId
        ? getPlanFromPriceId(priceId, isOldAccount(team.plan))
        : null;
      const isDual = plan && planHasDualPricing(plan);

      if (
        type === "manage" &&
        (upgradePlan || addSeat) &&
        subscriptionData.id
      ) {
        if (isDual && perSeatPriceId) {
          // Dual pricing: update base item to qty 1, and per-seat item to the requested quantity
          updateItems.push({
            id: subscriptionData.id,
            quantity: 1,
            price: priceId,
          });

          if (addSeat) {
            // When adding seats, the quantity is the total additional users
            const perSeatItemId = subscriptionData.perSeatId;
            if (perSeatItemId) {
              updateItems.push({
                id: perSeatItemId,
                quantity: quantity ?? 0,
                price: perSeatPriceId,
              });
            }
          } else {
            // New subscription upgrade: start with 0 additional seats
            updateItems.push({
              id: subscriptionData.perSeatId || subscriptionData.id,
              quantity: 0,
              price: perSeatPriceId,
            });
          }
        } else {
          // Single pricing (Pro) or legacy subscription
          updateItems.push({
            id: subscriptionData.id,
            quantity: isOldAccount(team.plan)
              ? 1
              : (quantity ?? plan?.includedUsers ?? 1),
            price: priceId,
          });
        }
      }

      const { url } = await stripe.billingPortal.sessions.create({
        customer: team.stripeId,
        return_url: `${process.env.NEXTAUTH_URL}/settings/billing?cancel=true`,
        ...(type === "manage" &&
          (upgradePlan || addSeat) &&
          updateItems.length > 0 && {
            flow_data: {
              type: "subscription_update_confirm",
              subscription_update_confirm: {
                subscription: team.subscriptionId,
                items: updateItems,
              },
              after_completion: {
                type: "redirect",
                redirect: {
                  return_url:
                    return_url ??
                    `${process.env.NEXTAUTH_URL}/settings/billing?success=true`,
                },
              },
            },
          }),
        ...(type === "subscription_update" && {
          flow_data: {
            type: "subscription_update",
            subscription_update: {
              subscription: team.subscriptionId,
            },
          },
        }),
        ...(type === "cancellation" && {
          flow_data: {
            type: "subscription_cancel",
            subscription_cancel: {
              subscription: team.subscriptionId,
            },
            after_completion: {
              type: "redirect",
              redirect: {
                return_url:
                  return_url ??
                  `${process.env.NEXTAUTH_URL}/settings/billing?cancellation=true`,
              },
            },
          },
        }),
      });

      waitUntil(identifyUser(userEmail ?? userId));
      waitUntil(
        trackAnalytics({
          event: "Stripe Billing Portal Clicked",
          teamId,
          action: proAnnualBanner ? "pro-annual-banner" : undefined,
        }),
      );

      return res.status(200).json(url);
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
