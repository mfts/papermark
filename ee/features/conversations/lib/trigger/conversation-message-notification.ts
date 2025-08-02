import { logger, task } from "@trigger.dev/sdk/v3";

import prisma from "@/lib/prisma";
import { ZViewerNotificationPreferencesSchema } from "@/lib/zod/schemas/notifications";

type NotificationPayload = {
  dataroomId: string;
  messageId: string;
  conversationId: string;
  teamId: string;
  senderUserId: string;
};

export const sendConversationMessageNotificationTask = task({
  id: "send-conversation-message-notification",
  retry: { maxAttempts: 3 },
  run: async (payload: NotificationPayload) => {
    // Get all verified viewers for this dataroom
    const participants = await prisma.conversationParticipant.findMany({
      where: {
        conversationId: payload.conversationId,
        receiveNotifications: true,
        viewer: {
          verified: true,
        },
      },
      select: {
        id: true,
        viewer: {
          select: {
            id: true,
            notificationPreferences: true,
            views: {
              where: {
                conversationViews: {
                  some: {
                    conversationId: payload.conversationId,
                  },
                },
              },
              take: 1,
              select: {
                link: {
                  select: {
                    id: true,
                    slug: true,
                    domainSlug: true,
                    domainId: true,
                    isArchived: true,
                    expiresAt: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Get team members (ADMIN/MANAGER) for this team
    const teamMembers = await prisma.userTeam.findMany({
      where: {
        teamId: payload.teamId,
        role: {
          in: ["ADMIN", "MANAGER"],
        },
        userId: {
          not: payload.senderUserId, // Don't notify the sender
        },
        // Only active team members (not blocked)
        blockedAt: null,
      },
      select: {
        userId: true,
        user: {
          select: {
            id: true,
            email: true,
            notificationPreferences: true,
          },
        },
      },
    });

    if ((!participants || participants.length === 0) && (!teamMembers || teamMembers.length === 0)) {
      logger.info("No participants or team members found for this conversation", {
        conversationId: payload.conversationId,
        teamId: payload.teamId,
      });
      return;
    }

    // Construct simplified viewer objects with link information
    const viewersWithLinks = participants
      .map((participant) => {
        const viewer = participant.viewer;
        if (!viewer || !viewer.views || viewer.views.length === 0) {
          return null;
        }

        const view = viewer.views[0];
        const link = view.link;

        if (!link || link.isArchived || (link.expiresAt && link.expiresAt < new Date())) {
          return null; // Skip archived or expired links
        }

        const baseUrl = link.domainSlug
          ? `https://${link.domainSlug}`
          : process.env.NEXT_PUBLIC_BASE_URL;

        const linkUrl = `${baseUrl}/view/${link.slug}`;

        return {
          id: viewer.id,
          linkUrl,
        };
      })
      .filter((viewer) => viewer !== null) as Array<{
      id: string;
      linkUrl: string;
    }>;

    logger.info("Processed viewer links", {
      viewerCount: viewersWithLinks.length,
    });

    logger.info("Found team members for notification", {
      teamMemberCount: teamMembers.length,
      teamId: payload.teamId,
    });

    // Send notification to each viewer
    for (const viewer of viewersWithLinks) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/send-conversation-new-message-notification`,
          {
            method: "POST",
            body: JSON.stringify({
              conversationId: payload.conversationId,
              dataroomId: payload.dataroomId,
              linkUrl: viewer.linkUrl,
              viewerId: viewer.id,
              senderUserId: payload.senderUserId,
              teamId: payload.teamId,
            }),
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
            },
          },
        );

        if (!response.ok) {
          logger.error("Failed to send dataroom notification", {
            viewerId: viewer.id,
            dataroomId: payload.dataroomId,
            error: await response.text(),
          });
          continue;
        }

        const { message } = (await response.json()) as { message: string };
        logger.info("Notification sent successfully", {
          viewerId: viewer.id,
          message,
        });
      } catch (error) {
        logger.error("Error sending notification", {
          viewerId: viewer.id,
          error,
        });
      }
    }

    // Send notification to each team member
    for (const teamMember of teamMembers) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/send-conversation-team-member-notification`,
          {
            method: "POST",
            body: JSON.stringify({
              conversationId: payload.conversationId,
              dataroomId: payload.dataroomId,
              userId: teamMember.userId,
              senderUserId: payload.senderUserId,
              teamId: payload.teamId,
            }),
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
            },
          },
        );

        if (!response.ok) {
          logger.error("Failed to send team member notification", {
            userId: teamMember.userId,
            dataroomId: payload.dataroomId,
            error: await response.text(),
          });
          continue;
        }

        const { message } = (await response.json()) as { message: string };
        logger.info("Team member notification sent successfully", {
          userId: teamMember.userId,
          message,
        });
      } catch (error) {
        logger.error("Error sending team member notification", {
          userId: teamMember.userId,
          error,
        });
      }
    }

    logger.info("Completed sending notifications", {
      dataroomId: payload.dataroomId,
      conversationId: payload.conversationId,
      viewerCount: viewersWithLinks.length,
      teamMemberCount: teamMembers.length,
    });
    return;
  },
});
