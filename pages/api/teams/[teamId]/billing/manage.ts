import { NextApiRequest, NextApiResponse } from "next";

import { waitUntil } from "@vercel/functions";
import { getServerSession } from "next-auth/next";

import { identifyUser, trackAnalytics } from "@/lib/analytics";
import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { stripeInstance } from "@/lib/stripe";
import { isOldAccount } from "@/lib/stripe/utils";
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
    // POST /api/teams/:teamId/billing/manage – manage a user's subscription
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const { teamId } = req.query as { teamId: string };
    const userId = (session.user as CustomUser).id;
    const userEmail = (session.user as CustomUser).email;
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
          plan: true,
        },
      });

      if (!team) {
        return res.status(400).json({ error: "Team does not exists" });
      }
      if (!team.stripeId) {
        return res.status(400).json({ error: "No Stripe customer ID" });
      }

      const stripe = stripeInstance(isOldAccount(team.plan));
      const { url } = await stripe.billingPortal.sessions.create({
        customer: team.stripeId,
        return_url: `${process.env.NEXTAUTH_URL}/settings/billing`,
      });

      waitUntil(identifyUser(userEmail ?? userId));
      waitUntil(
        trackAnalytics({
          event: "Stripe Billing Portal Clicked",
          teamId,
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
