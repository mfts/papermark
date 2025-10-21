import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth/next";

import { LIMITS } from "@/lib/constants";
import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { getDocumentWithTeamAndUser } from "@/lib/team/helper";
import { getViewPageDuration } from "@/lib/tinybird";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";

import { authOptions } from "../../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/links/:id/visits
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    // get link id from query params
    const { id } = req.query as { id: string };

    const userId = (session.user as CustomUser).id;

    try {
      // get the numPages from document
      const result = await prisma.link.findUnique({
        where: {
          id: id,
        },
        select: {
          deletedAt: true,
          document: {
            select: {
              id: true,
              numPages: true,
              versions: {
                where: { isPrimary: true },
                orderBy: { createdAt: "desc" },
                take: 1,
                select: { numPages: true },
              },
              team: {
                select: {
                  id: true,
                  plan: true,
                },
              },
            },
          },
        },
      });

      // If link doesn't exist (deleted), return empty array
      if (!result || !result.document || result.deletedAt) {
        return res.status(200).json([]);
      }

      const docId = result.document.id;

      // check if the the team that own the document has the current user
      await getDocumentWithTeamAndUser({
        docId,
        userId,
        options: {
          team: {
            select: {
              users: {
                select: {
                  userId: true,
                },
              },
            },
          },
        },
      });

      const numPages =
        result?.document?.versions[0]?.numPages ||
        result?.document?.numPages ||
        0;

      const views = await prisma.view.findMany({
        where: {
          linkId: id,
        },
        orderBy: {
          viewedAt: "desc",
        },
      });

      // limit the number of views to 20 on free plan
      const limitedViews =
        result?.document?.team?.plan === "free"
          ? views.slice(0, LIMITS.views)
          : views;

      const durationsPromises = limitedViews.map((view) => {
        return getViewPageDuration({
          documentId: view.documentId!,
          viewId: view.id,
          since: 0,
        });
      });

      const durations = await Promise.all(durationsPromises);

      // Sum up durations for each view
      const summedDurations = durations.map((duration) => {
        return duration.data.reduce(
          (totalDuration, data) => totalDuration + data.sum_duration,
          0,
        );
      });

      // Construct the response combining views and their respective durations
      const viewsWithDuration = limitedViews.map((view, index) => {
        // calculate the completion rate
        const completionRate = numPages
          ? (durations[index].data.length / numPages) * 100
          : 0;

        return {
          ...view,
          duration: durations[index],
          totalDuration: summedDurations[index],
          completionRate: completionRate.toFixed(),
        };
      });

      // TODO: Check that the user is owner of the links, otherwise return 401

      return res.status(200).json(viewsWithDuration);
    } catch (error) {
      log({
        message: `Failed to get views for link: _${id}_. \n\n ${error} \n\n*Metadata*: \`{userId: ${userId}}\``,
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
