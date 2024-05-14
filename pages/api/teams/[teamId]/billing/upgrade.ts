import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth/next";

import { identifyUser, trackAnalytics } from "@/lib/analytics";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../../../auth/[...nextauth]";

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
      select: { stripeId: true },
    });

    if (!team) {
      res.status(404).end("Unauthorized");
      return;
    }

    let stripeSession;

    if (team.stripeId) {
      // if the team already has a stripeId (i.e. is a customer) let's use as a customer
      stripeSession = await stripe.checkout.sessions.create({
        customer: team.stripeId,
        customer_update: { name: "auto" },
        billing_address_collection: "required",
        success_url: `${process.env.NEXTAUTH_URL}/settings/billing?success=true`,
        cancel_url: `${process.env.NEXTAUTH_URL}/settings/billing?cancel=true`,
        line_items: [{ price: priceId, quantity: 1 }],
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
        line_items: [{ price: priceId, quantity: 1 }],
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
    }

    await identifyUser(userEmail ?? userId);
    await trackAnalytics({
      event: "Stripe Checkout Clicked",
      teamId,
      priceId: priceId,
    });

    return res.status(200).json(stripeSession);
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
