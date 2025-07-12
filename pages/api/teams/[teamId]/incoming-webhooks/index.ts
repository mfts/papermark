import { NextApiRequest, NextApiResponse } from "next";

import { getFeatureFlags } from "@/lib/featureFlags";
import { generateWebhookId } from "@/lib/incoming-webhooks";
import {
  AuthenticatedRequest,
  withTeamAccessOrToken,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { teamId } = req.query as { teamId: string };

  // Check feature flag
  const features = await getFeatureFlags({ teamId });
  if (!features.incomingWebhooks) {
    return res
      .status(403)
      .json({ error: "This feature is not available for your team" });
  }

  if (req.method === "GET") {
    return withTeamAccessOrToken(
      req,
      res,
      async (authenticatedReq: AuthenticatedRequest, res: NextApiResponse) => {
        try {
          // Fetch webhooks
          const webhooks = await prisma.incomingWebhook.findMany({
            where: {
              teamId,
            },
            select: {
              id: true,
              name: true,
              externalId: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          });

          // Transform the response to match the interface
          const transformedWebhooks = webhooks.map((webhook) => ({
            id: webhook.id,
            name: webhook.name,
            webhookId: webhook.externalId,
            createdAt: webhook.createdAt,
          }));

          return res.status(200).json(transformedWebhooks);
        } catch (error) {
          console.error(error);
          return res.status(500).json({ error: "Error fetching webhooks" });
        }
      },
    );
  }

  if (req.method === "POST") {
    return withTeamAccessOrToken(
      req,
      res,
      async (authenticatedReq: AuthenticatedRequest, res: NextApiResponse) => {
        try {
          const { name } = req.body;
          if (!name) {
            return res.status(400).json({ error: "Name is required" });
          }

          // Generate webhook ID and secret
          const webhookId = generateWebhookId(teamId);

          // Create incoming webhook
          const incomingWebhook = await prisma.incomingWebhook.create({
            data: {
              name: "New Incoming Webhook",
              externalId: webhookId,
              teamId,
            },
          });

          return res.status(200).json({
            name: incomingWebhook.name,
            webhookId: incomingWebhook.externalId,
          });
        } catch (error) {
          console.error("Error creating webhook:", error);
          return res.status(500).json({ error: "Internal server error" });
        }
      },
    );
  }

  if (req.method === "DELETE") {
    return withTeamAccessOrToken(
      req,
      res,
      async (authenticatedReq: AuthenticatedRequest, res: NextApiResponse) => {
        try {
          const { webhookId } = req.body;

          // Check if user has admin role for DELETE operations
          const userRole = authenticatedReq.team?.users?.[0]?.role;
          if (userRole !== "ADMIN") {
            return res
              .status(403)
              .json({ error: "Forbidden: Admin access required" });
          }

          // Delete the webhook
          await prisma.incomingWebhook.delete({
            where: {
              id: webhookId,
              teamId, // Ensure webhook belongs to the team
            },
          });

          return res
            .status(200)
            .json({ message: "Webhook deleted successfully" });
        } catch (error) {
          console.error(error);
          return res.status(500).json({ error: "Error deleting webhook" });
        }
      },
      {
        requireAdmin: true, // Only admins can delete webhooks
      },
    );
  }

  return res.status(405).json({ error: "Method not allowed" });
}
