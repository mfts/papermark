import { NextApiResponse } from "next";

import { runs } from "@trigger.dev/sdk/v3";
import { waitUntil } from "@vercel/functions";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { sendDataroomChangeNotificationTask } from "@/lib/trigger/dataroom-change-notification";
import { log } from "@/lib/utils";
import { sortItemsByIndexAndName } from "@/lib/utils/sort-items-by-index-name";

export const config = {
  // in order to enable `waitUntil` function
  supportsResponseStreaming: true,
};

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // GET /api/teams/:teamId/datarooms/:id/documents
    const { id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };

    try {
      const documents = await prisma.dataroomDocument.findMany({
        where: {
          dataroomId: dataroomId,
          folderId: null,
        },
        orderBy: [
          { orderIndex: "asc" },
          {
            document: {
              name: "asc",
            },
          },
        ],
        include: {
          document: {
            select: {
              id: true,
              name: true,
              type: true,
              versions: {
                select: { id: true, hasPages: true },
              },
              isExternalUpload: true,
              _count: {
                select: {
                  views: { where: { dataroomId } },
                  versions: true,
                },
              },
            },
          },
        },
      });

      const sortedDocuments = sortItemsByIndexAndName(documents);

      return res.status(200).json(sortedDocuments);
    } catch (error) {
      console.error("Request error", error);
      return res
        .status(500)
        .json({ error: "Error fetching documents from dataroom" });
    }
  },
  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // POST /api/teams/:teamId/datarooms/:id/documents
    const { teamId, id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };

    const userId = req.user.id;

    // Assuming data is an object with `name` and `description` properties
    const { documentId, folderPathName } = req.body as {
      documentId: string;
      folderPathName?: string;
    };

    try {
      const folder = await prisma.dataroomFolder.findUnique({
        where: {
          dataroomId_path: {
            dataroomId,
            path: "/" + folderPathName,
          },
        },
        select: {
          id: true,
        },
      });

      const document = await prisma.dataroomDocument.create({
        data: {
          documentId,
          dataroomId,
          folderId: folder?.id,
        },
        include: {
          dataroom: {
            select: {
              enableChangeNotifications: true,
              links: {
                select: { id: true },
                orderBy: { createdAt: "desc" },
                take: 1,
              },
              _count: { select: { viewerGroups: true } },
            },
          },
        },
      });

      // Check if the team has the dataroom change notification enabled
      if (document.dataroom.enableChangeNotifications) {
        // Get all delayed and queued runs for this dataroom
        const allRuns = await runs.list({
          taskIdentifier: ["send-dataroom-change-notification"],
          tag: [`dataroom_${dataroomId}`],
          status: ["DELAYED", "QUEUED"],
          period: "10m",
        });

        // Cancel any existing unsent notification runs for this dataroom
        await Promise.all(allRuns.data.map((run) => runs.cancel(run.id)));

        waitUntil(
          sendDataroomChangeNotificationTask.trigger(
            {
              dataroomId,
              dataroomDocumentId: document.id,
              senderUserId: userId,
              teamId,
            },
            {
              idempotencyKey: `dataroom-notification-${teamId}-${dataroomId}-${document.id}`,
              tags: [
                `team_${teamId}`,
                `dataroom_${dataroomId}`,
                `document_${document.id}`,
              ],
              delay: new Date(Date.now() + 10 * 60 * 1000), // 10 minute delay
            },
          ),
        );
      }

      return res.status(201).json(document);
    } catch (error) {
      log({
        message: `Failed to create dataroom document. \n\n*teamId*: _${teamId}_, \n\n*dataroomId*: ${dataroomId} \n\n ${error}`,
        type: "error",
      });
      errorhandler(error, res);
    }
  },
});
