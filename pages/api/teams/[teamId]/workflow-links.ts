import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId } = req.query as { teamId: string };
    const userId = (session.user as CustomUser).id;

    try {
      // Check if user is part of the team
      const hasAccess = await prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId: userId,
            teamId: teamId,
          },
        },
      });
      if (!hasAccess) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Fetch all links with document/dataroom info
      const links = await prisma.link.findMany({
        where: {
          teamId,
          linkType: {
            in: ["DOCUMENT_LINK", "DATAROOM_LINK"],
          },
          deletedAt: null,
          isArchived: false,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          domainSlug: true,
          linkType: true,
          documentId: true,
          dataroomId: true,
          allowList: true,
          document: {
            select: {
              id: true,
              name: true,
            },
          },
          dataroom: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Format response with better labels
      const formattedLinks = links.map((link) => {
        const resourceName =
          link.linkType === "DOCUMENT_LINK"
            ? link.document?.name
            : link.dataroom?.name;

        // Build display name priority: name > domain/slug > slug > resource name > id
        let displayName = link.name;
        if (!displayName && link.domainSlug && link.slug) {
          displayName = `${link.domainSlug}/${link.slug}`;
        } else if (!displayName && link.slug) {
          displayName = link.slug;
        } else if (!displayName && resourceName) {
          displayName = resourceName;
        } else if (!displayName) {
          displayName = link.id.substring(0, 8);
        }

        return {
          id: link.id,
          name: link.name,
          slug: link.slug,
          domainSlug: link.domainSlug, // Will be null for papermark.com links
          linkType: link.linkType,
          documentId: link.documentId,
          dataroomId: link.dataroomId,
          allowList: link.allowList, // Pre-populate conditions from link
          resourceName, // Document or Dataroom name
          displayName, // Human-readable label
        };
      });

      return res.status(200).json(formattedLinks);
    } catch (error) {
      console.error("Error fetching workflow links:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  res.setHeader("Allow", ["GET"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
