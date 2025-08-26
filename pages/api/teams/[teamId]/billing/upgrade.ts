import { NextApiRequest, NextApiResponse } from "next";

import { stripeInstance } from "@/ee/stripe";
import { getPlanFromPriceId, isOldAccount } from "@/ee/stripe/utils";
import { waitUntil } from "@vercel/functions";
import { getServerSession } from "next-auth/next";

import { identifyUser, trackAnalytics } from "@/lib/analytics";
import { dub } from "@/lib/dub";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../../../auth/[...nextauth]";

export const config = {
  // in order to enable `waitUntil` function
  supportsResponseStreaming: true,
};

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // POST /api/teams/:teamId/billing/upgrade
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const { teamId, priceId } = req.query as {
      teamId: string;
      priceId: string;
    };

    const { id: userId, email: userEmail } = session.user as CustomUser;

    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
        users: {
          some: {
            userId,
          },
        },
      },
      select: { stripeId: true, plan: true },
    });

    if (!team) {
      res.status(404).end("Unauthorized");
      return;
    }

    const oldAccount = isOldAccount(team.plan);
    const plan = getPlanFromPriceId(priceId, oldAccount);

    if (!plan) {
      res.status(400).json({ error: "Invalid price ID" });
      return;
    }

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

    const customer = await dub.customers.list({
      externalId: userId, // their user ID within your app
      includeExpandedFields: true,
    });

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
        client_reference_id: teamId,
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
        client_reference_id: teamId,
        ...(customer.length > 0 &&
          customer[0].discount?.couponId && {
            discounts: [
              {
                coupon:
                  process.env.NODE_ENV !== "production" &&
                  customer[0].discount.couponTestId
                    ? customer[0].discount.couponTestId
                    : customer[0].discount.couponId,
              },
            ],
          }),
        metadata: {
          dubCustomerId: userId,
        },
      });
    }

    waitUntil(
      Promise.all([
        identifyUser(userEmail ?? userId),
        trackAnalytics({
          event: "Stripe Checkout Clicked",
          teamId,
          priceId: priceId,
        }),
      ]),
    );

    return res.status(200).json(stripeSession);
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
