import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/datarooms/:id/views
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };
    const userId = (session.user as CustomUser).id;

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId: (session.user as CustomUser).id,
            },
          },
        },
        select: {
          id: true,
        },
      });

      if (!team) {
        return res.status(403).end("Unauthorized to access this team");
      }

      // Get pagination parameters
      const page = Math.max(1, Number.parseInt(req.query.page as string) || 1);
      const limit = Math.min(
        50,
        Math.max(1, Number.parseInt(req.query.limit as string) || 10),
      );
      const search = req.query.search as string;

      // Build where clause for views
      const where = {
        viewType: "DATAROOM_VIEW" as const,
        ...(search
          ? {
            OR: [
              { viewerEmail: { contains: search, mode: "insensitive" as const } },
              { link: { name: { contains: search, mode: "insensitive" as const } } },
            ],
          }
          : {}),
      };

      // Get total count for pagination
      const total = await prisma.view.count({
        where: {
          ...where,
          dataroomId: dataroomId,
        },
      });

      const dataroom = await prisma.dataroom.findUnique({
        where: {
          id: dataroomId,
          teamId: teamId,
        },
        select: {
          id: true,
          teamId: true,
          name: true,
          views: {
            where: {
              ...where,
            },
            orderBy: {
              viewedAt: "desc",
            },
            skip: (page - 1) * limit,
            take: limit,
            include: {
              link: {
                select: {
                  name: true,
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

      const views = dataroom?.views || [];

      const returnViews = views.map((view) => {
        return {
          ...view,
          dataroomName: dataroom?.name,
          internal: users.some((user) => user.email === view.viewerEmail), // set internal to true if view.viewerEmail is in the users list
        };
      });

      return res.status(200).json({
        views: returnViews,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      log({
        message: `Failed to get views for dataroom: _${dataroomId}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, userId: ${userId}}\``,
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
