import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";

import { authOptions } from "../../../../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/datarooms/:id/links
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
      // Check if the user is part of the team
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId: userId,
            },
          },
        },
      });

      if (!team) {
        return res.status(401).end("Unauthorized");
      }

      const links = await prisma.link.findMany({
        where: {
          dataroomId,
          linkType: "DATAROOM_LINK",
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          views: {
            where: {
              viewType: "DATAROOM_VIEW",
            },
            orderBy: {
              viewedAt: "desc",
            },
          },
          _count: {
            select: { views: { where: { viewType: "DATAROOM_VIEW" } } },
          },
        },
      });

      return res.status(200).json(links);
    } catch (error) {
      log({
        message: `Failed to get links for dataroom: _${dataroomId}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, userId: ${userId}}\``,
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
