import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { runs } from "@trigger.dev/sdk/v3";
import { waitUntil } from "@vercel/functions";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { sendDataroomChangeNotificationTask } from "@/lib/trigger/dataroom-change-notification";
import { CustomUser } from "@/lib/types";

export const config = {
  supportsResponseStreaming: true,
};

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // POST /api/teams/:teamId/documents/:id/add-to-dataroom
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, id: docId } = req.query as { teamId: string; id: string };
    const { dataroomId } = req.body as { dataroomId: string };

    const userId = (session.user as CustomUser).id;

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId,
            },
          },
          documents: {
            some: {
              id: {
                equals: docId,
              },
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

      if (team.plan === "free" || team.plan === "pro") {
        return res.status(403).json({
          message: "Upgrade your plan to use datarooms.",
        });
      }

      let document;
      try {
        document = await prisma.dataroom.update({
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
          select: {
            enableChangeNotifications: true,
            documents: {
              where: {
                documentId: docId,
              },
              include: {
                document: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        });
      } catch (error) {
        return res.status(500).json({
          message: "Document already exists in dataroom!",
        });
      }
      const createdDocument = document.documents[0];
      if (document.enableChangeNotifications && createdDocument) {
        const allRuns = await runs.list({
          taskIdentifier: ["send-dataroom-change-notification"],
          tag: [`dataroom_${dataroomId}`],
          status: ["DELAYED", "QUEUED"],
          period: "10m",
        });

        await Promise.all(
          allRuns.data.map((run) =>
            runs.cancel(run.id).catch((error) => {
              console.error(`Failed to cancel run ${run.id}:`, error);
              return null;
            })
          )
        );

        waitUntil(
          sendDataroomChangeNotificationTask.trigger(
            {
              dataroomId,
              dataroomDocumentId: createdDocument.id,
              senderUserId: userId,
              teamId,
            },
            {
              idempotencyKey: `dataroom-notification-${teamId}-${dataroomId}-${createdDocument.id}`,
              tags: [
                `team_${teamId}`,
                `dataroom_${dataroomId}`,
                `document_${createdDocument.id}`,
              ],
              delay: new Date(Date.now() + 10 * 60 * 1000),
            },
          ),
        );
      }

      return res.status(200).json({
        message: "Document added to dataroom!",
      });
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
