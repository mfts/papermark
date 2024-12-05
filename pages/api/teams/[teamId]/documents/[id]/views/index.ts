import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { LIMITS } from "@/lib/constants";
import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { getViewPageDuration } from "@/lib/tinybird";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/documents/:id/views
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    // get document id and teamId from query params

    const { teamId, id: docId } = req.query as { teamId: string; id: string };
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const offset = (page - 1) * limit;

    console.log("offset", offset);

    const userId = (session.user as CustomUser).id;

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId: userId,
            },
          },
        },
        select: { plan: true },
      });

      if (!team) {
        return res.status(404).end("Team not found");
      }

      const document = await prisma.document.findUnique({
        where: { id: docId, teamId: teamId },
        select: {
          id: true,
          ownerId: true,
          numPages: true,
          versions: {
            orderBy: { createdAt: "desc" },
            select: {
              versionNumber: true,
              createdAt: true,
              numPages: true,
            },
          },
          _count: {
            select: {
              views: true,
            },
          },
        },
      });

      if (!document) {
        return res.status(404).end("Document not found");
      }

      const views = await prisma.view.findMany({
        skip: offset, // Implementing pagination
        take: limit, // Limit the number of views fetched
        where: {
          documentId: docId,
        },
        orderBy: {
          viewedAt: "desc",
        },
        include: {
          link: {
            select: {
              name: true,
            },
          },
          feedbackResponse: {
            select: {
              id: true,
              data: true,
            },
          },
          agreementResponse: {
            select: {
              id: true,
              agreementId: true,
              agreement: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!views) {
        return res.status(404).end("Document has no views");
      }

      const users = await prisma.user.findMany({
        where: {
          teams: {
            some: {
              teamId: teamId,
            },
          },
        },
        select: {
          email: true,
        },
      });

      // filter the last 20 views
      const limitedViews =
        team.plan === "free" && offset >= LIMITS.views ? [] : views;

      const durationsPromises = limitedViews?.map((view: { id: string }) => {
        return getViewPageDuration({
          documentId: docId,
          viewId: view.id,
          since: 0,
        });
      });

      const durations = await Promise.all(durationsPromises);

      // Sum up durations for each view
      const summedDurations = durations.map((duration) => {
        return duration.data.reduce(
          (totalDuration: number, data: { sum_duration: number }) =>
            totalDuration + data.sum_duration,
          0,
        );
      });

      // Construct the response combining views and their respective durations
      const viewsWithDuration = limitedViews?.map(
        (view: any, index: number) => {
          // find the relevant document version for the view
          const relevantDocumentVersion = document.versions.find(
            (version) => version.createdAt <= view.viewedAt,
          );

          // get the number of pages for the document version or the document
          const numPages =
            relevantDocumentVersion?.numPages || document.numPages || 0;

          // calculate the completion rate
          const completionRate = numPages
            ? (durations[index].data.length / numPages) * 100
            : 0;

          return {
            ...view,
            internal: users.some((user) => user.email === view.viewerEmail), // set internal to true if view.viewerEmail is in the users list
            duration: durations[index],
            totalDuration: summedDurations[index],
            completionRate: completionRate.toFixed(),
            versionNumber: relevantDocumentVersion?.versionNumber || 0,
            versionNumPages: numPages,
          };
        },
      );

      return res.status(200).json({
        viewsWithDuration,
        hiddenViewCount: views.length - limitedViews.length,
        totalViews: document._count.views || 0,
      });
    } catch (error) {
      log({
        message: `Failed to get views for document: _${docId}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, userId: ${userId}}\``,
        type: "error",
      });
      errorhandler(error, res);
    }
  } else {
    // We only allow GET requests
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
