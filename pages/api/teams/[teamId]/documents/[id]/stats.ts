import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../../../../auth/[...nextauth]";
import { getTotalAvgPageDuration } from "@/lib/tinybird";
import { CustomUser } from "@/lib/types";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";
import { errorhandler } from "@/lib/errorHandler";

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
      const { document } = await getTeamWithUsersAndDocument({
        teamId,
        userId,
        docId,
        checkOwner: true,
        options: {
          include: {
            views: true,
          },
        },
      });

      const views = document?.views;

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
      errorhandler(error, res);
    }
  } else {
    // We only allow GET requests
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
