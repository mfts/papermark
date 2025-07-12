import { NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";
import { decryptEncrpytedPassword, log } from "@/lib/utils";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // GET /api/teams/:teamId/documents/:id/links
    const { id: docId } = req.query as { id: string };

    try {
      const { document } = await getTeamWithUsersAndDocument({
        teamId: req.team!.id,
        userId: req.user.id,
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
                customFields: {
                  select: {
                    orderIndex: true,
                    label: true,
                    identifier: true,
                    placeholder: true,
                    type: true,
                    required: true,
                  },
                  orderBy: {
                    orderIndex: "asc",
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

      let links = document!.links;

      // Decrypt the password for each link
      if (links && links.length > 0) {
        links = await Promise.all(
          links.map(async (link) => {
            // Decrypt the password if it exists
            if (link.password !== null) {
              link.password = decryptEncrpytedPassword(link.password);
            }
            const tags = await prisma.tag.findMany({
              where: {
                items: {
                  some: {
                    linkId: link.id,
                    itemType: "LINK_TAG",
                  },
                },
              },
              select: {
                id: true,
                name: true,
                color: true,
                description: true,
              },
            });

            return {
              ...link,
              tags,
            };
          }),
        );
      }

      res.status(200).json(links);
    } catch (error) {
      log({
        message: `Failed to get links for document: _${docId}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${req.team!.id}, userId: ${req.user.id}}\``,
        type: "error",
      });
      errorhandler(error, res);
    }
  },
});
