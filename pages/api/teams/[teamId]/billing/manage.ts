import { NextApiResponse } from "next";

import { stripeInstance } from "@/ee/stripe";
import { getPriceIdFromPlan } from "@/ee/stripe/functions/get-price-id-from-plan";
import { getQuantityFromPriceId } from "@/ee/stripe/functions/get-quantity-from-plan";
import getSubscriptionItem from "@/ee/stripe/functions/get-subscription-item";
import { PLANS, isOldAccount } from "@/ee/stripe/utils";
import { waitUntil } from "@vercel/functions";

import { identifyUser, trackAnalytics } from "@/lib/analytics";
import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export const config = {
  // in order to enable `waitUntil` function
  supportsResponseStreaming: true,
};

export default createTeamHandler({
  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // POST /api/teams/:teamId/billing/manage – manage a user's subscription
    const userEmail = req.user.email;
    const {
      priceId,
      upgradePlan,
      quantity,
      addSeat,
      proAnnualBanner,
      return_url,
    } = req.body as {
      priceId: string;
      upgradePlan: boolean;
      quantity?: number;
      addSeat?: boolean;
      proAnnualBanner?: boolean;
      return_url?: string;
    };

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: req.team!.id,
        },
        select: {
          stripeId: true,
          subscriptionId: true,
          plan: true,
        },
      });

      if (!team) {
        res.status(400).json({ error: "Team does not exists" });
        return;
      }
      if (!team.stripeId) {
        res.status(400).json({ error: "No Stripe customer ID" });
        return;
      }

      if (!team.subscriptionId) {
        res.status(400).json({ error: "No subscription ID" });
        return;
      }

      const subscriptionItemId = await getSubscriptionItem(
        team.subscriptionId,
        isOldAccount(team.plan),
      );

      const minQuantity = getQuantityFromPriceId(priceId);

      const stripe = stripeInstance(isOldAccount(team.plan));
      const { url } = await stripe.billingPortal.sessions.create({
        customer: team.stripeId,
        return_url: `${process.env.NEXTAUTH_URL}/settings/billing?cancel=true`,
        ...((upgradePlan || addSeat) &&
          subscriptionItemId && {
            flow_data: {
              type: "subscription_update_confirm",
              subscription_update_confirm: {
                subscription: team.subscriptionId,
                items: [
                  {
                    id: subscriptionItemId,
                    quantity: isOldAccount(team.plan)
                      ? 1
                      : (quantity ?? minQuantity),
                    price: priceId,
                  },
                ],
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
      });

      waitUntil(identifyUser(userEmail ?? req.user.id));
      waitUntil(
        trackAnalytics({
          event: "Stripe Billing Portal Clicked",
          teamId: req.team!.id,
          action: proAnnualBanner ? "pro-annual-banner" : undefined,
        }),
      );

      res.status(200).json(url);
    } catch (error) {
      errorhandler(error, res);
    }
  },
});
