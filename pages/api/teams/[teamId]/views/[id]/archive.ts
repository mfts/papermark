import { NextApiRequest, NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createTeamHandler({
  PUT: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId, id } = req.query as { teamId: string; id: string };
    const { isArchived } = req.body;

    try {
      // Update the link in the database
      const updatedView = await prisma.view.update({
        where: { id, teamId },
        data: {
          isArchived: isArchived,
        },
      });

      if (!updatedView) {
        res.status(404).json({ error: "View not found" });
        return;
      }

      res.status(200).json(updatedView);
    } catch (error) {
      errorhandler(error, res);
    }
  },
});
