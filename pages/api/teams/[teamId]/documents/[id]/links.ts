import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../../../../auth/[...nextauth]";
import { log } from "@/lib/utils";
import { CustomUser } from "@/lib/types";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";
import { errorhandler } from "@/lib/errorHandler";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/documents/:id/links
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

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
            ownerId: true,
            id: true,
            links: {
              orderBy: {
                createdAt: "asc",
              },
              include: {
                views: {
                  orderBy: {
                    viewedAt: "desc",
                  },
                },
                _count: {
                  select: { views: true },
                },
              },
            },
          },
        },
      });

      const links = document!.links;
      return res.status(200).json(links);
    } catch (error) {
      log(`Failed to get links for document ${docId}. Error: \n\n ${error}`);
      errorhandler(error, res);
    }
  } else {
    // We only allow GET requests
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
