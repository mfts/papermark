import { isTeamPausedById } from "@/ee/features/billing/cancellation/lib/is-team-paused";

import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";
import { sendWebhooks } from "@/lib/webhook/send-webhooks";

export async function sendLinkCreatedWebhook({
  teamId,
  data,
}: {
  teamId: string;
  data: any;
}) {
  try {
    const {
      link_id: linkId,
      document_id: documentId,
      dataroom_id: dataroomId,
    } = data;

    if (!linkId || !teamId) {
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
          array_contains: ["link.created"],
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

    // Get link information
    const link = await prisma.link.findUnique({
      where: { id: linkId, teamId },
    });

    if (!link) {
      throw new Error("Link not found");
    }

    // Prepare link data for webhook
    const linkData = {
      id: link.id,
      url: link.domainId
        ? `https://${link.domainSlug}/${link.slug}`
        : `https://www.papermark.com/view/${link.id}`,
      domain:
        link.domainId && link.domainSlug ? link.domainSlug : "papermark.com",
      key: link.domainId && link.slug ? link.slug : `view/${link.id}`,
      name: link.name,
      expiresAt: link.expiresAt?.toISOString() || null,
      hasPassword: !!link.password,
      allowList: link.allowList,
      denyList: link.denyList,
      enabledEmailProtection: link.emailProtected,
      enabledEmailVerification: link.emailAuthenticated,
      allowDownload: link.allowDownload ?? false,
      isArchived: link.isArchived,
      enabledNotification: link.enableNotification ?? false,
      enabledFeedback: link.enableFeedback ?? false,
      enabledQuestion: link.enableQuestion ?? false,
      enabledScreenshotProtection: link.enableScreenshotProtection ?? false,
      enabledConfidentialView: link.enableConfidentialView ?? false,
      enabledAgreement: link.enableAgreement ?? false,
      enabledWatermark: link.enableWatermark ?? false,
      metaTitle: link.metaTitle,
      metaDescription: link.metaDescription,
      metaImage: link.metaImage,
      metaFavicon: link.metaFavicon,
      documentId: link.documentId,
      dataroomId: link.dataroomId,
      groupId: link.groupId,
      permissionGroupId: link.permissionGroupId,
      linkType: link.linkType,
      teamId: teamId,
      createdAt: link.createdAt.toISOString(),
      updatedAt: link.updatedAt.toISOString(),
    };

    // Get document and dataroom information for webhook in parallel
    const [document, dataroom] = await Promise.all([
      documentId
        ? prisma.document.findUnique({
            where: { id: documentId, teamId },
            select: {
              id: true,
              name: true,
              contentType: true,
              createdAt: true,
            },
          })
        : null,
      dataroomId
        ? prisma.dataroom.findUnique({
            where: { id: dataroomId, teamId },
            select: { id: true, name: true, createdAt: true },
          })
        : null,
    ]);

    // Prepare webhook payload
    const webhookData = {
      link: linkData,
      ...(document && {
        document: {
          id: document.id,
          name: document.name,
          contentType: document.contentType,
          teamId: teamId,
          createdAt: document.createdAt.toISOString(),
        },
      }),
      ...(dataroom && {
        dataroom: {
          id: dataroom.id,
          name: dataroom.name,
          teamId: teamId,
          createdAt: dataroom.createdAt.toISOString(),
        },
      }),
    };

    // Send webhooks
    if (webhooks.length > 0) {
      await sendWebhooks({
        webhooks,
        trigger: "link.created",
        data: webhookData,
      });
    }
    return;
  } catch (error) {
    log({
      message: `Error sending webhooks for link created: ${error}`,
      type: "error",
      mention: true,
    });
    return;
  }
}
