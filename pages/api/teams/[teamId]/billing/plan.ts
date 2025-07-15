import { NextApiResponse } from "next";

import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId } = req.query as { teamId: string };

    try {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
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
      return res.status(500).json({ error: "Internal server error" });
    }
  },
});
