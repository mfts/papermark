import { NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import { getFeatureFlags } from "@/lib/featureFlags";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // GET /api/teams/:teamId/datarooms/:id
    const { id: dataroomId } = req.query as {
      id: string;
    };

    try {
      const dataroom = await prisma.dataroom.findUnique({
        where: {
          id: dataroomId,
          teamId: req.team!.id,
        },
      });

      if (!dataroom) {
        res.status(404).json({
          error: "Not Found",
          message: "The requested dataroom does not exist",
        });
        return;
      }

      res.status(200).json(dataroom);
    } catch (error) {
      errorhandler(error, res);
    }
  },
  PATCH: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // PATCH /api/teams/:teamId/datarooms/:id
    const { id: dataroomId } = req.query as {
      id: string;
    };

    try {
      const { name, enableChangeNotifications } = req.body as {
        name?: string;
        enableChangeNotifications?: boolean;
      };

      const featureFlags = await getFeatureFlags({ teamId: req.team!.id });
      const isDataroomsPlus = req.team!.plan.includes("datarooms-plus");
      const isTrial = req.team!.plan.includes("drtrial");

      if (
        enableChangeNotifications !== undefined &&
        !isDataroomsPlus &&
        !isTrial &&
        !featureFlags.roomChangeNotifications
      ) {
        res.status(403).json({
          message: "This feature is not available in your plan",
        });
        return;
      }

      const dataroom = await prisma.dataroom.update({
        where: {
          id: dataroomId,
        },
        data: {
          ...(name && { name }),
          ...(typeof enableChangeNotifications === "boolean" && {
            enableChangeNotifications,
          }),
        },
      });

      res.status(200).json(dataroom);
    } catch (error) {
      errorhandler(error, res);
    }
  },
  DELETE: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // DELETE /api/teams/:teamId/datarooms/:id
    const { id: dataroomId } = req.query as {
      id: string;
    };

    try {
      // Check if the dataroom belongs to the team
      const dataroom = await prisma.dataroom.findFirst({
        where: {
          id: dataroomId,
          teamId: req.team!.id,
        },
      });

      if (!dataroom) {
        res.status(401).end("Unauthorized");
        return;
      }

      // check if current user is admin of the team
      const teamUser = await prisma.userTeam.findFirst({
        where: {
          teamId: req.team!.id,
          userId: req.user.id,
        },
        select: {
          role: true,
        },
      });

      if (!teamUser || !["ADMIN", "MANAGER"].includes(teamUser.role)) {
        res.status(403).json({
          message:
            "You are not permitted to perform this action. Only admin and managers can delete datarooms.",
        });
        return;
      }

      await prisma.dataroom.delete({
        where: {
          id: dataroomId,
          teamId: req.team!.id,
        },
      });

      res.status(204).end();
    } catch (error) {
      errorhandler(error, res);
    }
  },
});
