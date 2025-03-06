import { NextApiRequest, NextApiResponse } from "next";

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
          startsAt: true,
          endsAt: true,
        },
      });

      const isCustomer = !!team?.stripeId;

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

      return res.status(200).json({
        plan: team?.plan,
        isCustomer,
        subscriptionCycle,
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
