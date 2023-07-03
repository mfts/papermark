import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]";
import { getTotalAvgPageDuration } from "@/lib/tinybird";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // GET /api/documents/:id
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { id } = req.query as { id: string };

    try {
      const views = await prisma.view.findMany({
        where: { documentId: id },
      });

      const groupedViews = await prisma.view.groupBy({
        by: ["viewerEmail"],
        where: { documentId: id },
        _count: { id: true },
      });

      const duration = await getTotalAvgPageDuration({
        documentId: id,
        since: 0,
      });

      const total_duration = duration.data.reduce(
        (totalDuration, data) => totalDuration + data.avg_duration,
        0
      );

      const stats = { views, groupedViews, duration, total_duration };

      // TODO: Check that the user is owner of the document, otherwise return 401

      res.status(200).json(stats);
    } catch (error) {
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
