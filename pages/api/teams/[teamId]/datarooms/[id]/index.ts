import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { DefaultPermissionStrategy } from "@prisma/client";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import { getFeatureFlags } from "@/lib/featureFlags";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/datarooms/:id
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };

    const userId = (session.user as CustomUser).id;

    try {
      // Check if the user is part of the team
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId: userId,
            },
          },
        },
      });

      if (!team) {
        return res.status(401).end("Unauthorized");
      }

      const dataroom = await prisma.dataroom.findUnique({
        where: {
          id: dataroomId,
          teamId,
        },
        include: {
          _count: { select: { viewerGroups: true, permissionGroups: true } },
        },
      });

      if (!dataroom) {
        return res.status(404).json({
          error: "Not Found",
          message: "The requested dataroom does not exist",
        });
      }

      return res.status(200).json(dataroom);
    } catch (error) {
      errorhandler(error, res);
    }
  } else if (req.method === "PATCH") {
    // PATCH /api/teams/:teamId/datarooms/:id
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };

    const userId = (session.user as CustomUser).id;

    try {
      // Check if the user is part of the team
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
          id: true,
          plan: true,
        },
      });

      if (!team) {
        return res.status(401).end("Unauthorized");
      }

      const { name, enableChangeNotifications, defaultPermissionStrategy, allowBulkDownload } =
        req.body as {
          name?: string;
          enableChangeNotifications?: boolean;
          defaultPermissionStrategy?: DefaultPermissionStrategy;
          allowBulkDownload?: boolean;
        };

      const featureFlags = await getFeatureFlags({ teamId: team.id });
      const isDataroomsPlus = team.plan.includes("datarooms-plus");
      const isTrial = team.plan.includes("drtrial");

      if (
        enableChangeNotifications !== undefined &&
        !isDataroomsPlus &&
        !isTrial &&
        !featureFlags.roomChangeNotifications
      ) {
        return res.status(403).json({
          message: "This feature is not available in your plan",
        });
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
          ...(defaultPermissionStrategy && { defaultPermissionStrategy }),
          ...(typeof allowBulkDownload === "boolean" && {
            allowBulkDownload,
          }),
        },
      });

      return res.status(200).json(dataroom);
    } catch (error) {
      errorhandler(error, res);
    }
  } else if (req.method === "DELETE") {
    // DELETE /api/teams/:teamId/datarooms/:id
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };

    try {
      // Check if the user is part of the team
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          datarooms: {
            some: {
              id: dataroomId,
            },
          },
        },
        include: { users: true },
      });

      if (!team) {
        return res.status(401).end("Unauthorized");
      }

      // check if current user is admin of the team
      const isUserAdmin = team.users.some(
        (user) =>
          (user.role === "ADMIN" || user.role === "MANAGER") &&
          user.userId === (session.user as CustomUser).id,
      );
      if (!isUserAdmin) {
        return res.status(403).json({
          message:
            "You are not permitted to perform this action. Only admin and managers can delete datarooms.",
        });
      }

      await prisma.dataroom.delete({
        where: {
          id: dataroomId,
          teamId,
        },
      });

      return res.status(204).end();
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow GET, and PATCH requests
    res.setHeader("Allow", ["GET", "PATCH"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
