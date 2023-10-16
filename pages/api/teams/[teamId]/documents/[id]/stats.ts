import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../../../../auth/[...nextauth]";
import { getTotalAvgPageDuration } from "@/lib/tinybird";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/documents/:id/stats
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, id: docId } = req.query as { teamId: string; id: string };

    const userId = (session.user as CustomUser).id;

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
        },
        include: {
          users: {
            select: {
              userId: true,
            },
          },
          documents: {
            select: {
              ownerId: true,
              id: true,
              views: true,
            },
          },
        },
      });

      // check if the team exists
      if (!team) {
        return res.status(400).end("Team doesn't exists");
      }

      // check if the user is part the team
      const teamHasUser = team?.users.some((user) => user.userId === userId);
      if (!teamHasUser) {
        return res.status(401).end("You are not a member of the team");
      }

      // check if the document exists in the team
      const document = team?.documents.find((doc) => doc.id === docId);
      if (!document) {
        return res.status(400).end("Document doesn't exists in the team");
      }

      // Check that the user is owner of the document, otherwise return 401
      const isUserOwnerOfDocument = document.ownerId === userId;
      if (!isUserOwnerOfDocument) {
        return res.status(401).end("Unauthorized access to the document");
      }

      const views = document.views;

      const groupedViews = await prisma.view.groupBy({
        by: ["viewerEmail"],
        where: { documentId: docId },
        _count: { id: true },
      });

      const duration = await getTotalAvgPageDuration({
        documentId: docId,
        since: 0,
      });

      const total_duration = duration.data.reduce(
        (totalDuration, data) => totalDuration + data.avg_duration,
        0
      );

      const stats = { views, groupedViews, duration, total_duration };

      return res.status(200).json(stats);
    } catch (error) {
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else {
    // We only allow GET requests
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
