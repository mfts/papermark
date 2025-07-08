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

    // check if team is on paid plan
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { plan: true },
    });

    if (
      team?.plan === "free" ||
      team?.plan === "pro"
    ) {
      // team is not on paid plan, so we don't need to send webhooks
      return;
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
