import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { getDocumentDurationPerViewer } from "@/lib/tinybird";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/viewers/:id
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, id } = req.query as { teamId: string; id: string };

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
      });

      if (
        !team ||
        (team.plan.includes("free") && !team.plan.includes("trial"))
      ) {
        return res.status(404).json({ message: "Team not found" });
      }

      const viewer = await prisma.viewer.findUnique({
        where: { id, teamId },
        include: {
          views: {
            where: {
              documentId: {
                not: null,
              },
            },
          },
        },
      });

      // same but for documentId
      const groupedViewsByDocumentId = viewer?.views.reduce(
        (
          acc: Record<
            string,
            {
              documentId: string;
              viewCount: number;
              viewIds: string[];
              lastViewed: Date;
            }
          >,
          view,
        ) => {
          const key = view.documentId!;
          if (!acc[key]) {
            acc[key] = {
              documentId: view.documentId ?? "",
              viewCount: 0,
              viewIds: [],
              lastViewed: new Date(0),
            };
          }
          acc[key].viewCount++;
          acc[key].viewIds.push(view.id);
          if (view.viewedAt > acc[key].lastViewed) {
            acc[key].lastViewed = view.viewedAt;
          }
          return acc;
        },
        {},
      );

      // get the document details for each documentId
      let documentDetails: {
        id: string;
        name: string | null;
        type: string | null;
        contentType: string | null;
      }[] = [];
      if (groupedViewsByDocumentId) {
        documentDetails = await prisma.document.findMany({
          where: {
            id: {
              in: Object.keys(groupedViewsByDocumentId),
            },
          },
          select: {
            id: true,
            name: true,
            type: true,
            contentType: true,
          },
        });
      }

      // Calculate sum_duration for each document
      const documentDurations = await Promise.all(
        Object.entries(groupedViewsByDocumentId ?? {}).map(
          async ([documentId, view]) => {
            const durationResult = await getDocumentDurationPerViewer({
              documentId,
              viewIds: view.viewIds.join(","),
            });
            return {
              documentId,
              sum_duration: durationResult.data[0].sum_duration,
            };
          },
        ),
      );

      // Create a map for quick lookup
      const durationMap = new Map(
        documentDurations.map((d) => [d.documentId, d.sum_duration]),
      );

      // create a new array with the grouped views and merge with document details
      const groupedViews = groupedViewsByDocumentId
        ? Object.values(groupedViewsByDocumentId).map((view) => {
            const document = documentDetails?.find(
              (doc) => doc.id === view.documentId,
            );

            return {
              ...view,
              document,
              totalDuration: durationMap.get(view.documentId) || 0,
            };
          })
        : [];

      const newViewer = {
        ...viewer,
        views: groupedViews,
      };

      return res.status(200).json(newViewer);
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow GET requests
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
