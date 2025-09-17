import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { ItemType } from "@prisma/client";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/datarooms/:id/groups?documentId=:documentId
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };
    const documentId = req.query?.documentId as string;
    const userId = (session.user as CustomUser).id;

    try {
      const teamAccess = await prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId: userId,
            teamId: teamId,
          },
        },
      });

      if (!teamAccess) {
        return res.status(401).end("Unauthorized");
      }

      // First, verify dataroom exists and get basic info
      const dataroom = await prisma.dataroom.findUnique({
        where: {
          id: dataroomId,
          teamId: teamId,
        },
        select: {
          id: true,
          teamId: true,
          name: true,
        },
      });

      if (!dataroom) {
        return res.status(404).end("Dataroom not found");
      }

      // Then, get viewer groups with optimized separate queries
      const viewerGroups = await prisma.viewerGroup.findMany({
        where: {
          dataroomId: dataroomId,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          ...(documentId
            ? {
                accessControls: {
                  where: {
                    itemId: documentId,
                    itemType: ItemType.DATAROOM_DOCUMENT,
                  },
                  select: {
                    id: true,
                    canView: true,
                    canDownload: true,
                    itemId: true,
                  },
                },
              }
            : {}),
        },
      });

      // Get counts separately with efficient GROUP BY queries
      const groupIds = viewerGroups.map((g) => g.id);

      const [memberCounts, viewCounts] = await Promise.all([
        prisma.viewerGroupMembership.groupBy({
          by: ["groupId"],
          where: {
            groupId: { in: groupIds },
          },
          _count: { id: true },
        }),
        prisma.view.groupBy({
          by: ["groupId"],
          where: {
            groupId: { in: groupIds },
          },
          _count: { id: true },
        }),
      ]);

      // Create lookup maps for counts
      const memberCountMap = new Map(
        memberCounts.map((mc) => [mc.groupId, mc._count.id]),
      );
      const viewCountMap = new Map(
        viewCounts.map((vc) => [vc.groupId, vc._count.id]),
      );

      // Combine viewer groups with their counts
      const viewerGroupsWithCounts = viewerGroups.map((group) => ({
        ...group,
        _count: {
          members: memberCountMap.get(group.id) || 0,
          views: viewCountMap.get(group.id) || 0,
        },
      }));

      return res.status(200).json(viewerGroupsWithCounts);
    } catch (error) {
      log({
        message: `Failed to get groups for dataroom: _${dataroomId}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, userId: ${userId}}\``,
        type: "error",
      });
      errorhandler(error, res);
    }
  } else if (req.method === "POST") {
    // POST /api/teams/:teamId/datarooms/:id/groups
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const userId = (session.user as CustomUser).id;
    const { teamId, id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };

    const { name } = req.body as { name: string };

    try {
      // Check if the user is part of the team
      const teamAccess = await prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId: userId,
            teamId: teamId,
          },
        },
      });

      if (!teamAccess) {
        return res.status(401).end("Unauthorized");
      }

      const group = await prisma.viewerGroup.create({
        data: {
          name: name,
          dataroomId,
          teamId,
        },
      });

      res.status(201).json(group);
    } catch (error) {
      console.error("Request error", error);
      res.status(500).json({ error: "Error creating folder" });
    }
  } else {
    // We only allow GET, POST requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
