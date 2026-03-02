import { logger, task } from "@trigger.dev/sdk/v3";

import prisma from "@/lib/prisma";
import { queueNotification } from "@/lib/redis/dataroom-notification-queue";
import { ZViewerNotificationPreferencesSchema } from "@/lib/zod/schemas/notifications";

type NotificationPayload = {
  dataroomId: string;
  dataroomDocumentId: string;
  senderUserId: string;
  teamId: string;
};

export const sendDataroomChangeNotificationTask = task({
  id: "send-dataroom-change-notification",
  retry: { maxAttempts: 3 },
  run: async (payload: NotificationPayload) => {
    const viewers = await prisma.viewer.findMany({
      where: {
        teamId: payload.teamId,
        views: {
          some: {
            dataroomId: payload.dataroomId,
            viewType: "DATAROOM_VIEW",
            verified: true,
          },
        },
      },
      select: {
        id: true,
        notificationPreferences: true,
        views: {
          where: {
            dataroomId: payload.dataroomId,
            viewType: "DATAROOM_VIEW",
            verified: true,
          },
          orderBy: {
            viewedAt: "desc",
          },
          take: 1,
          include: {
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
    });

    if (!viewers || viewers.length === 0) {
      logger.info("No verified viewers found for this dataroom", {
        dataroomId: payload.dataroomId,
      });
      return;
    }

    const viewersWithLinks = viewers
      .map((viewer) => {
        const view = viewer.views[0];
        const link = view?.link;

        if (
          !link ||
          link.isArchived ||
          (link.expiresAt && new Date(link.expiresAt) < new Date())
        ) {
          return null;
        }

        const parsedPreferences =
          ZViewerNotificationPreferencesSchema.safeParse(
            viewer.notificationPreferences,
          );

        if (
          parsedPreferences.success &&
          parsedPreferences.data.dataroom[payload.dataroomId]?.enabled === false
        ) {
          return null;
        }

        const frequency =
          parsedPreferences.success
            ? (parsedPreferences.data.dataroom[payload.dataroomId]?.frequency ??
              "instant")
            : "instant";

        let linkUrl = "";
        if (link.domainId && link.domainSlug && link.slug) {
          linkUrl = `https://${link.domainSlug}/${link.slug}`;
        } else {
          linkUrl = `${process.env.NEXT_PUBLIC_MARKETING_URL}/view/${link.id}`;
        }

        return {
          id: viewer.id,
          linkUrl,
          frequency,
        };
      })
      .filter(
        (
          viewer,
        ): viewer is {
          id: string;
          linkUrl: string;
          frequency: "instant" | "daily" | "weekly";
        } => viewer !== null,
      );

    logger.info("Processed viewer links", {
      viewerCount: viewersWithLinks.length,
    });

    for (const viewer of viewersWithLinks) {
      try {
        if (viewer.frequency === "daily" || viewer.frequency === "weekly") {
          await queueNotification({
            frequency: viewer.frequency,
            viewerId: viewer.id,
            dataroomId: payload.dataroomId,
            teamId: payload.teamId,
            dataroomDocumentId: payload.dataroomDocumentId,
            senderUserId: payload.senderUserId,
          });

          logger.info("Queued notification for digest", {
            viewerId: viewer.id,
            frequency: viewer.frequency,
          });
          continue;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/send-dataroom-new-document-notification`,
          {
            method: "POST",
            body: JSON.stringify({
              dataroomId: payload.dataroomId,
              linkUrl: viewer.linkUrl,
              dataroomDocumentId: payload.dataroomDocumentId,
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

    logger.info("Completed sending notifications", {
      dataroomId: payload.dataroomId,
      viewerCount: viewers.length,
    });
    return;
  },
});
