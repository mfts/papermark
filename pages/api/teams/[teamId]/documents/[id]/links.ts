import { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@prisma/client";

import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
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
    const { page = "1", limit = "10", search, tags } = req.query;
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    const userId = (session.user as CustomUser).id;

    try {
      // Build where clause for filtering
      const where: Prisma.LinkWhereInput = {
        documentId: docId,
        teamId: teamId,
        ...(search && {
          OR: [
            { name: { contains: search as string, mode: Prisma.QueryMode.insensitive } },
            { url: { contains: search as string, mode: Prisma.QueryMode.insensitive } },
          ],
        }),
        ...(tags && {
          tags: {
            some: {
              tag: {
                name: {
                  in: (tags as string).split(","),
                },
              },
            },
          },
        }),
      };

      // Get total count for pagination
      const totalLinks = await prisma.link.count({ where });

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
              where,
              orderBy: {
                createdAt: "desc",
              },
              skip,
              take: limitNumber,
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

      return res.status(200).json({
        links,
        pagination: {
          total: totalLinks,
          pages: Math.ceil(totalLinks / limitNumber),
          page: pageNumber,
          limit: limitNumber,
        },
      });
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
