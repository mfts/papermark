import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth/next";

import { LIMITS } from "@/lib/constants";
import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";

import { authOptions } from "../../auth/[...nextauth]";
import { ViewType } from "@prisma/client";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/links/:id/visits-requestFile
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    // get link id from query params
    const { id } = req.query as { id: string };

    const userId = (session.user as CustomUser).id;

    try {
      const result = await prisma.link.findUnique({
        where: {
          id: id,
        },
        select: {
          team: {
            select: {
              plan: true,
            },
          },
        },
      });

      if (!result) {
        return res.status(404).end("Link not found");
      }

      const views = await prisma.view.findMany({
        where: {
          linkId: id,
          viewType: { equals: ViewType.FILE_REQUEST_VIEW },
        },
        select: {
          id: true,
          viewedAt: true,
          viewerEmail: true,
          uploadDocumentIds: true,  
          uploadFolder: {
            select: {
              path: true,
            },
          },
          uploadDataroomFolder: {
            select: {
              path: true,
              dataroom: {
                select: {
                  name: true,
                  id: true,
                },
              },
            },
          },
        },
        orderBy: {
          viewedAt: "desc",
        },
      });

      // Add document count to each view
      const viewsWithCount = views.map(view => ({
        ...view,
        documentCount: view.uploadDocumentIds?.length || 0,
      }));

      // limit the number of views to 20 on free plan
      const limitedViews =
        result?.team?.plan === "free" ? viewsWithCount.slice(0, LIMITS.views) : viewsWithCount;

      return res.status(200).json(limitedViews);
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
