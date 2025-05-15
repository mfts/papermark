import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { LIMITS } from "@/lib/constants";
import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { getDocumentWithTeamAndUser } from "@/lib/team/helper";
import { getViewPageDuration } from "@/lib/tinybird";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";

import { authOptions } from "../../auth/[...nextauth]";

const querySchema = z.object({
  id: z.string().min(1, "Link ID is required"),
  page: z.string().optional().transform((val) => parseInt(val || "1")),
  limit: z.string().optional().transform((val) => parseInt(val || "10")),
});

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

    try {
      // Validate query parameters
      const { id, page, limit } = querySchema.parse(req.query);

      const userId = (session.user as CustomUser).id;

      // get the numPages from document
      const result = await prisma.link.findUnique({
        where: {
          id: id,
        },
        select: {
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

      const docId = result?.document!.id!;

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

      // Get total count of views
      const totalViews = await prisma.view.count({
        where: {
          linkId: id,
        },
      });

      const views = await prisma.view.findMany({
        where: {
          linkId: id,
        },
        orderBy: {
          viewedAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
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

      return res.status(200).json({
        views: viewsWithDuration,
        pagination: {
          total: totalViews,
          pages: Math.ceil(totalViews / limit),
          currentPage: page,
          pageSize: limit,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid request parameters",
          details: error.errors,
        });
      }

      log({
        message: `Failed to get views for link: _${req.query.id}_. \n\n ${error} \n\n*Metadata*: \`{userId: ${(session.user as CustomUser).id}}\``,
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
