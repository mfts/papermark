import { NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createAuthenticatedHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createAuthenticatedHandler({
  PUT: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // PUT /api/links/:id/archive
    const { id } = req.query as { id: string };
    const { isArchived } = req.body;

    try {
      // Update the link in the database
      const updatedLink = await prisma.link.update({
        where: { id: id },
        data: {
          isArchived: isArchived,
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
          tags: {
            select: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  color: true,
                },
              },
            },
          },
        },
      });
      if (!updatedLink) {
        res.status(404).json({ error: "Link not found" });
        return;
      }

      const { tags, ...rest } = updatedLink;
      const linkTags = tags.map((t) => t.tag);

      await fetch(
        `${process.env.NEXTAUTH_URL}/api/revalidate?secret=${process.env.REVALIDATE_TOKEN}&linkId=${id}&hasDomain=${updatedLink.domainId ? "true" : "false"}`,
      );

      res.status(200).json({ ...rest, tags: linkTags });
    } catch (error) {
      errorhandler(error, res);
    }
  },
});
