import { NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createTeamHandler({
  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // POST /api/teams/:teamId/documents/:id/add-to-dataroom
    const { id: docId } = req.query as { id: string };
    const { dataroomId } = req.body as { dataroomId: string };

    try {
      // Check plan restrictions for datarooms
      if (
        (req.team?.plan === "free" || req.team?.plan === "pro") &&
        !req.team?.plan?.includes("drtrial")
      ) {
        res.status(403).json({
          message: "Upgrade your plan to use datarooms.",
        });
        return;
      }

      try {
        await prisma.dataroom.update({
          where: {
            id: dataroomId,
          },
          data: {
            documents: {
              create: {
                documentId: docId,
              },
            },
          },
        });
      } catch (error) {
        res.status(500).json({
          message: "Document already exists in dataroom!",
        });
        return;
      }

      res.status(200).json({
        message: "Document added to dataroom!",
      });
    } catch (error) {
      errorhandler(error, res);
    }
  },
});
