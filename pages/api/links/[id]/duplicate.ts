import { NextApiResponse } from "next";

import { Prisma } from "@prisma/client";
import { waitUntil } from "@vercel/functions";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createAuthenticatedHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { sendLinkCreatedWebhook } from "@/lib/webhook/triggers/link-created";

export const config = {
  // in order to enable `waitUntil` function
  supportsResponseStreaming: true,
};

export default createAuthenticatedHandler({
  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // POST /api/links/:id/duplicate
    const { id } = req.query as { id: string };
    const { teamId } = req.body as { teamId: string };

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId: req.user.id,
            },
          },
        },
        select: { id: true },
      });

      if (!team) {
        res.status(401).end("Unauthorized");
        return;
      }

      const link = await prisma.link.findUnique({
        where: { id, teamId },
        include: {
          tags: {
            select: {
              tag: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

      if (!link) {
        res.status(404).json({ error: "Link not found" });
        return;
      }

      const { tags, ...rest } = link;
      const linkTags = tags.map((t) => t.tag.id);

      const newLinkName = link.name
        ? link.name + " (Copy)"
        : `Link #${link.id.slice(-5)} (Copy)`;

      const newLink = await prisma.$transaction(async (tx) => {
        const createdLink = await tx.link.create({
          data: {
            ...rest,
            id: undefined,
            slug: link.slug ? link.slug + "-copy" : null,
            name: newLinkName,
            watermarkConfig: link.watermarkConfig || Prisma.JsonNull,
            createdAt: undefined,
            updatedAt: undefined,
          },
        });

        if (linkTags?.length) {
          await tx.tagItem.createMany({
            data: linkTags.map((tagId: string) => ({
              tagId,
              itemType: "LINK_TAG",
              linkId: createdLink.id,
              taggedBy: req.user.id,
            })),
            skipDuplicates: true,
          });
        }

        const tags = linkTags?.length
          ? await tx.tag.findMany({
              where: { id: { in: linkTags } },
              select: { id: true, name: true, color: true, description: true },
            })
          : [];

        return { ...createdLink, tags };
      });
      const linkWithView = {
        ...newLink,
        _count: { views: 0 },
        views: [],
      };

      waitUntil(
        sendLinkCreatedWebhook({
          teamId,
          data: {
            link_id: newLink.id,
            document_id: newLink.documentId,
            dataroom_id: newLink.dataroomId,
          },
        }),
      );

      res.status(201).json(linkWithView);
    } catch (error) {
      errorhandler(error, res);
    }
  },
});
