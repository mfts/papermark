import { NextApiRequest, NextApiResponse } from "next";

import { Prisma } from "@prisma/client";
import { waitUntil } from "@vercel/functions";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { sendLinkCreatedWebhook } from "@/lib/webhook/triggers/link-created";

import { authOptions } from "../../auth/[...nextauth]";

export const config = {
  // in order to enable `waitUntil` function
  supportsResponseStreaming: true,
};

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // PUT /api/links/:id/duplicate
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { id } = req.query as { id: string };
    const { teamId } = req.body as { teamId: string };

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
        select: { id: true },
      });

      if (!team) {
        return res.status(401).end("Unauthorized");
      }

      const link = await prisma.link.findUnique({
        where: { id, teamId },
      });

      if (!link) {
        return res.status(404).json({ error: "Link not found" });
      }

      const newLinkName = link.name
        ? link.name + " (Copy)"
        : `Link #${link.id.slice(-5)} (Copy)`;

      const newLink = await prisma.link.create({
        data: {
          ...link,
          id: undefined,
          slug: link.slug ? link.slug + "-copy" : null,
          name: newLinkName,
          watermarkConfig: link.watermarkConfig || Prisma.JsonNull,
          createdAt: undefined,
          updatedAt: undefined,
        },
        include: {
          ...(link.linkType === "FILE_REQUEST_LINK"
            ? {
              folder: {
                select: {
                  id: true,
                  name: true,
                },
              },
              dataroomFolder: {
                select: {
                  id: true,
                  name: true,
                  dataroom: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            }
            : {}),
        },
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

      return res.status(201).json(linkWithView);
    } catch (error) {
      errorhandler(error, res);
    }
  }

  // We only allow PUT requests
  res.setHeader("Allow", ["POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
