import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { log } from "@/lib/utils";
import { getViewPageDuration } from "@/lib/tinybird";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";
import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { LIMITS } from "@/lib/constants";

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

    const userId = (session.user as CustomUser).id;

    try {
      const { document } = await getTeamWithUsersAndDocument({
        teamId,
        userId,
        docId,
        checkOwner: true,
        options: {
          select: {
            id: true,
            ownerId: true,
            numPages: true,
            versions: {
              where: { isPrimary: true },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { numPages: true },
            },
            views: {
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
              },
            },
          },
        },
      });

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

      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { plan: true },
      });

      // get the numPages from document
      const numPages =
        document?.versions?.[0]?.numPages || document?.numPages || 0;

      const views = document?.views || [];

      // filter the last 20 views
      const limitedViews =
        team?.plan === "free" ? views.slice(0, LIMITS.views) : views;

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
          };
        },
      );

      return res.status(200).json({
        viewsWithDuration,
        hiddenViewCount: views.length - limitedViews.length,
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
