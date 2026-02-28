import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { getDataroomViewDocumentStats, getViewPageDuration } from "@/lib/tinybird";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const {
      teamId,
      id: dataroomId,
      viewId,
    } = req.query as {
      teamId: string;
      id: string;
      viewId: string;
    };

    const documentViewId = req.query.documentViewId as string | undefined;
    const documentId = req.query.documentId as string | undefined;

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
        },
        select: { id: true },
      });

      if (!team) {
        return res.status(403).end("Unauthorized to access this team");
      }

      const dataroom = await prisma.dataroom.findUnique({
        where: { id: dataroomId, teamId },
        select: { id: true },
      });

      if (!dataroom) {
        return res.status(403).end("Unauthorized to access this dataroom");
      }

      const view = await prisma.view.findUnique({
        where: { id: viewId, dataroomId },
        select: { id: true },
      });

      if (!view) {
        return res.status(403).end("Unauthorized to access this view");
      }

      // If documentViewId and documentId are provided, return per-page stats
      if (documentViewId && documentId) {
        const documentView = await prisma.view.findUnique({
          where: {
            id: documentViewId,
            dataroomId,
            viewType: "DOCUMENT_VIEW",
          },
          select: { id: true },
        });

        if (!documentView) {
          return res
            .status(403)
            .end("Unauthorized to access this document view");
        }

        const duration = await getViewPageDuration({
          documentId,
          viewId: documentViewId,
          since: 0,
        });

        return res.status(200).json({ duration });
      }

      // Otherwise return summary stats for all document views under this dataroom view
      const documentViews = await prisma.view.findMany({
        where: {
          dataroomViewId: viewId,
          dataroomId,
          viewType: "DOCUMENT_VIEW",
        },
        select: {
          id: true,
          documentId: true,
          document: {
            select: {
              id: true,
              name: true,
              versions: {
                where: { isPrimary: true },
                take: 1,
                select: { numPages: true },
              },
            },
          },
        },
      });

      if (!documentViews.length) {
        return res.status(200).json({ documentStats: [] });
      }

      const viewIds = documentViews.map((v) => v.id).join(",");

      const tinybirdStats = await getDataroomViewDocumentStats({ viewIds });

      const statsMap = new Map(
        tinybirdStats.data.map((s) => [`${s.viewId}:${s.documentId}`, s]),
      );

      const documentStats = documentViews.map((dv) => {
        const stats = statsMap.get(`${dv.id}:${dv.documentId}`);
        const totalPages = dv.document?.versions?.[0]?.numPages ?? 0;
        const pagesViewed = stats?.pages_viewed ?? 0;
        const completionRate =
          totalPages > 0 ? Math.round((pagesViewed / totalPages) * 100) : 0;

        return {
          viewId: dv.id,
          documentId: dv.documentId,
          totalDuration: stats?.sum_duration ?? 0,
          pagesViewed,
          totalPages,
          completionRate,
        };
      });

      return res.status(200).json({ documentStats });
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
