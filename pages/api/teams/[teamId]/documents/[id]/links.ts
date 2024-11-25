import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";
import { CustomUser } from "@/lib/types";
import { decryptEncrpytedPassword, log } from "@/lib/utils";

import { authOptions } from "../../../../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
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
                createdAt: "desc",
              },
              include: {
                views: {
                  orderBy: {
                    viewedAt: "desc",
                  },
                },
                feedback: {
                  select: {
                    id: true,
                    data: true,
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

      // Decrypt the password for each link
      links?.forEach((link) => {
        if (link.password !== null) {
          link.password = decryptEncrpytedPassword(link.password);
        }
      });

      return res.status(200).json(links);
    } catch (error) {
      log({
        message: `Failed to get links for document: _${docId}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, userId: ${userId}}\``,
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
