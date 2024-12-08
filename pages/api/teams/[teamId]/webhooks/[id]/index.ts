import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { updateWebhookSchema } from "@/lib/zod/schemas/webhooks";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { teamId, id } = req.query as { teamId: string; id: string };
  const userId = (session.user as CustomUser).id;

  const userTeam = await prisma.userTeam.findFirst({
    where: {
      userId,
      teamId,
    },
  });

  if (!userTeam) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (req.method === "GET") {
    try {
      const webhook = await prisma.webhook.findFirst({
        where: {
          id,
          teamId,
        },
      });

      if (!webhook) {
        return res.status(404).json({ error: "Webhook not found" });
      }

      return res.status(200).json(webhook);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method === "PATCH") {
    try {
      const { name, triggers } = updateWebhookSchema.parse(req.body);

      const webhook = await prisma.webhook.update({
        where: {
          id,
          teamId,
        },
        data: {
          name,
          triggers,
        },
      });

      return res.status(200).json(webhook);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await prisma.webhook.delete({
        where: {
          id,
          teamId,
        },
      });

      return res.status(204).end();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
