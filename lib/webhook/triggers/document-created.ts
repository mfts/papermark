import { isTeamPausedById } from "@/ee/features/billing/cancellation/lib/is-team-paused";

import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";
import { sendWebhooks } from "@/lib/webhook/send-webhooks";

export async function sendDocumentCreatedWebhook({
  teamId,
  data,
}: {
  teamId: string;
  data: any;
}) {
  try {
    const { document_id: documentId } = data;

    if (!documentId || !teamId) {
      throw new Error("Missing required parameters");
    }

    // On self-hosted deployments all plans are webhook-eligible.
    if (process.env.NEXT_PUBLIC_SELF_HOSTED !== "true") {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { plan: true },
      });

      if (team?.plan === "free" || team?.plan === "pro") {
        return;
      }

      const teamIsPaused = await isTeamPausedById(teamId);
      if (teamIsPaused) {
        return;
      }
    }

    // Get webhooks for team
    const webhooks = await prisma.webhook.findMany({
      where: {
        teamId,
        triggers: {
          array_contains: ["document.created"],
        },
      },
      select: {
        pId: true,
        url: true,
        secret: true,
      },
    });

    if (!webhooks || (webhooks && webhooks.length === 0)) {
      // No webhooks for team, so we don't need to send webhooks
      return;
    }

    // Get document information
    const document = await prisma.document.findUnique({
      where: { id: documentId, teamId },
    });

    if (!document) {
      throw new Error("Document not found");
    }

    // Prepare document data for webhook
    const documentData = {
      id: document.id,
      name: document.name,
      contentType: document.contentType,
      teamId: document.teamId,
      createdAt: document.createdAt.toISOString(),
    };

    // Prepare webhook payload
    const webhookData = {
      document: documentData,
    };

    // Send webhooks
    if (webhooks.length > 0) {
      await sendWebhooks({
        webhooks,
        trigger: "document.created",
        data: webhookData,
      });
    }
    return;
  } catch (error) {
    log({
      message: `Error sending webhooks for document created: ${error}`,
      type: "error",
      mention: true,
    });
    return;
  }
}
