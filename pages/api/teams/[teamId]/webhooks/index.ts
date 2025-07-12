import { NextApiResponse } from "next";

import { newId } from "@/lib/id-helper";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { createWebhookSchema } from "@/lib/zod/schemas/webhooks";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // GET /api/teams/:teamId/webhooks
    try {
      const webhooks = await prisma.webhook.findMany({
        where: {
          teamId: req.team!.id,
        },
      });

      res.status(200).json(webhooks);
    } catch (error) {
      console.error("Error fetching webhooks:", error);
      res.status(500).json({ error: "Failed to fetch webhooks" });
    }
  },
  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
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
          teamId: req.team!.id,
        },
      });

      res.status(201).json(webhook);
    } catch (error) {
      console.error("Error creating webhook:", error);
      res.status(500).json({ error: "Failed to create webhook" });
    }
  },
});
