import { NextApiResponse } from "next";

import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { getWebhookEvents } from "@/lib/tinybird/pipes";
import { CustomUser } from "@/lib/types";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId, id: webhookId } = req.query as {
      teamId: string;
      id: string;
    };
    const userId = req.user.id;

    const userTeam = await prisma.userTeam.findFirst({
      where: {
        userId,
        teamId,
      },
    });

    if (!userTeam) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    try {
      const { pId } = await prisma.webhook.findUniqueOrThrow({
        where: {
          id: webhookId,
          teamId,
        },
        select: {
          pId: true,
        },
      });

      const events = await getWebhookEvents({
        webhookId: pId,
      });

      const parsedEvents = events.data.map((event) => ({
        ...event,
        request_body: JSON.parse(event.request_body as string),
      }));

      res.status(200).json(parsedEvents);
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  },
});
