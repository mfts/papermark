import { NextApiResponse } from "next";

import { ItemType } from "@prisma/client";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // GET /api/teams/:teamId/datarooms/:id/groups?documentId=:documentId
    const { teamId, id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };
    const documentId = req.query?.documentId as string;
    const userId = req.user.id;

    try {
      const dataroom = await prisma.dataroom.findUnique({
        where: {
          id: dataroomId,
          teamId: teamId,
        },
        select: {
          id: true,
          teamId: true,
          name: true,
          viewerGroups: {
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
              _count: {
                select: {
                  members: true,
                  views: true,
                },
              },
            },
          },
        },
      });

      if (!dataroom || !dataroom.viewerGroups) {
        res.status(404).end("Dataroom not found");
        return;
      }

      res.status(200).json(dataroom.viewerGroups);
    } catch (error) {
      log({
        message: `Failed to get groups for dataroom: _${dataroomId}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, userId: ${userId}}\``,
        type: "error",
      });
      errorhandler(error, res);
    }
  },
  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // POST /api/teams/:teamId/datarooms/:id/groups
    const userId = req.user.id;
    const { teamId, id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };

    const { name } = req.body as { name: string };

    try {
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
  },
});
