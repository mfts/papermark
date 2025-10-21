import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { decryptEncrpytedPassword, log } from "@/lib/utils";

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
      // First, ensure the requester belongs to the team
      const teamHasUser = await prisma.team.findFirst({
        where: { id: teamId, users: { some: { userId } } },
        select: { id: true },
      });
      if (!teamHasUser) {
        return res.status(401).end("Unauthorized");
      }
      // Then check if document has any links to avoid expensive query
      const document = await prisma.document.findUnique({
        where: {
          id: docId,
          teamId,
        },
        select: {
          id: true,
          ownerId: true,
          _count: {
            select: {
              links: true,
            },
          },
        },
      });

      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Early return for documents with no links
      if (document._count.links === 0) {
        return res.status(200).json([]);
      }

      // Only fetch full link data if we have links (target only this document)
      const docWithLinks = await prisma.document.findUnique({
        where: { id: docId, teamId },
        select: {
          id: true,
          ownerId: true,
          links: {
            where: { deletedAt: null }, // exclude deleted links
            orderBy: { createdAt: "desc" },
            include: {
              views: { orderBy: { viewedAt: "desc" } },
              feedback: { select: { id: true, data: true } },
              customFields: {
                select: {
                  orderIndex: true,
                  label: true,
                  identifier: true,
                  placeholder: true,
                  type: true,
                  required: true,
                },
                orderBy: { orderIndex: "asc" },
              },
              _count: { select: { views: true } },
            },
          },
        },
      });

      let links = docWithLinks!.links;

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
