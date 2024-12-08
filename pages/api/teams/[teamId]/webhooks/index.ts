import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { newId } from "@/lib/id-helper";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { createWebhookSchema } from "@/lib/zod/schemas/webhooks";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { teamId } = req.query as { teamId: string };
  const userId = (session.user as CustomUser).id;

  const userTeam = await prisma.userTeam.findFirst({
    where: {
      userId: userId,
      teamId: teamId,
    },
  });

  if (!userTeam) {
    return res.status(404).json({ error: "Team not found" });
  }

  if (req.method === "GET") {
    // GET /api/teams/:teamId/webhooks
    try {
      const webhooks = await prisma.webhook.findMany({
        where: {
          teamId: teamId,
        },
      });

      return res.status(200).json(webhooks);
    } catch (error) {
      console.error("Error fetching webhooks:", error);
      return res.status(500).json({ error: "Failed to fetch webhooks" });
    }
  } else if (req.method === "POST") {
    // POST /api/teams/:teamId/webhooks
    try {
      const { name, url, secret, triggers } = createWebhookSchema.parse(
        req.body,
      );

      const webhookId = newId("webhook");

      const webhook = await prisma.webhook.create({
        data: {
          pId: webhookId,
          name: name,
          url: url,
          secret: secret,
          triggers: triggers,
          teamId: teamId,
        },
      });

      return res.status(201).json(webhook);
    } catch (error) {
      console.error("Error creating webhook:", error);
      return res.status(500).json({ error: "Failed to create webhook" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
