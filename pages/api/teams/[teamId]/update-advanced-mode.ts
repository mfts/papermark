import { NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createTeamHandler({
  PATCH: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId } = req.query as { teamId: string };
    const { enableExcelAdvancedMode } = req.body;

    try {
      // Verify user is part of the team
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId: req.user.id,
            },
          },
        },
      });

      if (!team) {
        return res.status(404).json({ error: "Team not found." });
      }

      const isPlanRestricted = ["free", "starter", "pro"].includes(team.plan);
      const isTrial = team.plan.includes("trial");

      if (isPlanRestricted && !isTrial) {
        return res
          .status(403)
          .json({ error: "Your current plan does not allow this feature." });
      }

      // Update team limits
      await prisma.team.update({
        where: {
          id: teamId,
        },
        data: {
          enableExcelAdvancedMode,
        },
      });

      return res.status(200).json("Excel mode updated!");
    } catch (error) {
      errorhandler(error, res);
    }
  },
});
