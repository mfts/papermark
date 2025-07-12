import { NextApiResponse } from "next";

import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { updateWebhookSchema } from "@/lib/zod/schemas/webhooks";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { id } = req.query as { id: string };

    try {
      const webhook = await prisma.webhook.findFirst({
        where: {
          id,
          teamId: req.team!.id,
        },
      });

      if (!webhook) {
        res.status(404).json({ error: "Webhook not found" });
        return;
      }

      res.status(200).json(webhook);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  PATCH: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { id } = req.query as { id: string };

    try {
      const { name, triggers } = updateWebhookSchema.parse(req.body);

      const webhook = await prisma.webhook.update({
        where: {
          id,
          teamId: req.team!.id,
        },
        data: {
          name,
          triggers,
        },
      });

      res.status(200).json(webhook);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  DELETE: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { id } = req.query as { id: string };

    try {
      await prisma.webhook.delete({
        where: {
          id,
          teamId: req.team!.id,
        },
      });

      res.status(204).end();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
});
