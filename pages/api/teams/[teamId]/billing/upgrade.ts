import { NextApiResponse } from "next";

import { stripeInstance } from "@/ee/stripe";
import { getPlanFromPriceId, isOldAccount } from "@/ee/stripe/utils";
import { waitUntil } from "@vercel/functions";

import { identifyUser, trackAnalytics } from "@/lib/analytics";
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
    // POST /api/teams/:teamId/billing/upgrade
    const { priceId } = req.query as {
      priceId: string;
    };

    const { id: userId, email: userEmail } = req.user;

    const team = await prisma.team.findUnique({
      where: {
        id: req.team!.id,
      },
      select: { stripeId: true, plan: true },
    });

    if (!team) {
      res.status(404).end("Unauthorized");
      return;
    }

    const oldAccount = isOldAccount(team.plan);
    const plan = getPlanFromPriceId(priceId, oldAccount);
    const minimumQuantity = plan.minQuantity;

    let stripeSession;

    const lineItem = {
      price: priceId,
      quantity: oldAccount ? 1 : minimumQuantity,
      ...(!oldAccount && {
        adjustable_quantity: {
          enabled: true,
          minimum: minimumQuantity,
          maximum: 99,
        },
      }),
    };

    const stripe = stripeInstance(oldAccount);
    if (team.stripeId) {
      // if the team already has a stripeId (i.e. is a customer) let's use as a customer
      stripeSession = await stripe.checkout.sessions.create({
        customer: team.stripeId,
        customer_update: { name: "auto" },
        billing_address_collection: "required",
        success_url: `${process.env.NEXTAUTH_URL}/settings/billing?success=true`,
        cancel_url: `${process.env.NEXTAUTH_URL}/settings/billing?cancel=true`,
        line_items: [lineItem],
        automatic_tax: {
          enabled: true,
        },
        tax_id_collection: {
          enabled: true,
        },
        mode: "subscription",
        allow_promotion_codes: true,
        client_reference_id: req.team!.id,
      });
    } else {
      // else initialize a new customer
      stripeSession = await stripe.checkout.sessions.create({
        customer_email: userEmail ?? undefined,
        billing_address_collection: "required",
        success_url: `${process.env.NEXTAUTH_URL}/settings/billing?success=true`,
        cancel_url: `${process.env.NEXTAUTH_URL}/settings/billing?cancel=true`,
        line_items: [lineItem],
        automatic_tax: {
          enabled: true,
        },
        tax_id_collection: {
          enabled: true,
        },
        mode: "subscription",
        allow_promotion_codes: true,
        client_reference_id: req.team!.id,
      });
    }

    waitUntil(identifyUser(userEmail ?? userId));
    waitUntil(
      trackAnalytics({
        event: "Stripe Checkout Clicked",
        teamId: req.team!.id,
        priceId: priceId,
      }),
    );

    res.status(200).json(stripeSession);
  },
});
