import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { logger, runs } from "@trigger.dev/sdk/v3";
import { waitUntil } from "@vercel/functions";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import { getFeatureFlags } from "@/lib/featureFlags";
import prisma from "@/lib/prisma";
import { sendDataroomChangeNotificationTask } from "@/lib/trigger/dataroom-change-notification";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";
import { sortItemsByIndexAndName } from "@/lib/utils/sort-items-by-index-name";
import { hashToken } from "@/lib/api/auth/token";

export const config = {
  // in order to enable `waitUntil` function
  supportsResponseStreaming: true,
};

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/datarooms/:id/documents
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const userId = (session.user as CustomUser).id;
    const { teamId, id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };

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
  } else if (req.method === "POST") {
    // POST /api/teams/:teamId/datarooms/:id/documents
    const { teamId, id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };
    // Check for API token first
    const authHeader = req.headers.authorization;
    let userId: string;
    let token: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "");
      const hashedToken = hashToken(token);

      // Look up token in database
      const restrictedToken = await prisma.restrictedToken.findUnique({
        where: { hashedKey: hashedToken },
        select: { userId: true, teamId: true },
      });

      // Check if token exists
      if (!restrictedToken) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check if token is for the correct team
      if (restrictedToken.teamId !== teamId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      userId = restrictedToken.userId;
    } else {
      // Fall back to session auth
      const session = await getServerSession(req, res, authOptions);
      if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      userId = (session.user as CustomUser).id;
    }

    // Assuming data is an object with `name` and `description` properties
    const { documentId, folderPathName, googleDriveFileId, delay } = req.body as {
      documentId: string;
      folderPathName?: string;
      googleDriveFileId?: string;
      delay?: string;
    };
    const delayMs = delay ? parseInt(delay) : 10 * 60 * 1000; // default delay is 10 minutes
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
          googleDriveFileId,
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
              delay: new Date(Date.now() + delayMs),
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
  } else {
    // We only allow GET requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
