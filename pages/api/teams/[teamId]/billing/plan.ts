import { NextApiRequest, NextApiResponse } from "next";

import getSubscriptionItem, {
  SubscriptionDiscount,
} from "@/ee/stripe/functions/get-subscription-item";
import { isOldAccount } from "@/ee/stripe/utils";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../../../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/billing/plan
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId } = req.query as { teamId: string };
    const userId = (session.user as CustomUser).id;
    const withDiscount = req.query.withDiscount === "true";

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
          plan: true,
          stripeId: true,
          subscriptionId: true,
          startsAt: true,
          endsAt: true,
          pauseStartsAt: true,
          cancelledAt: true,
        },
      });

      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      const isCustomer = !!team.stripeId;

      // calculate the plan cycle either yearly or monthly based on the startsAt and endsAt dates
      let subscriptionCycle = "monthly";
      if (team?.startsAt && team?.endsAt) {
        const durationInDays = Math.round(
          (team.endsAt.getTime() - team.startsAt.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        // If duration is more than 31 days, consider it yearly
        subscriptionCycle = durationInDays > 31 ? "yearly" : "monthly";
      }

      // Fetch discount information if team has an active subscription
      let discount: SubscriptionDiscount | null = null;
      if (
        withDiscount &&
        team?.subscriptionId &&
        team.plan &&
        team.plan !== "free"
      ) {
        try {
          const subscriptionData = await getSubscriptionItem(
            team.subscriptionId,
            isOldAccount(team.plan),
          );
          discount = subscriptionData.discount;
        } catch (error) {
          // If we can't fetch discount info, just log and continue without it
          console.error("Failed to fetch discount information:", error);
        }
      }

      return res.status(200).json({
        plan: team.plan,
        startsAt: team.startsAt,
        endsAt: team.endsAt,
        isCustomer,
        subscriptionCycle,
        pauseStartsAt: team.pauseStartsAt,
        cancelledAt: team.cancelledAt,
        discount,
      });
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
