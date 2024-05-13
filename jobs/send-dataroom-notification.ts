import { client } from "@/trigger";
import { eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";

import prisma from "@/lib/prisma";

client.defineJob({
  id: "send-dataroom-notification",
  name: "Send Dataroom Notification",
  version: "0.0.1",
  trigger: eventTrigger({
    name: "dataroom.new_document",
    schema: z.object({
      dataroomId: z.string(),
      dataroomDocumentId: z.string(),
      linkId: z.string(),
      senderUserId: z.string(),
    }),
  }),
  run: async (payload, io, ctx) => {
    const { dataroomId, dataroomDocumentId, linkId, senderUserId } = payload;

    const viewerIds = await io.runTask("get-viewer-ids", async () => {
      const viewerIds = await prisma.viewer.findMany({
        where: {
          dataroomId,
        },
        select: {
          id: true,
        },
      });

      if (!viewerIds) {
        await io.logger.error("Failed to get viewer ids", { payload });
        return [];
      }

      return viewerIds;
    });

    if (!viewerIds || viewerIds.length === 0) {
      return {
        success: false,
        message: "No viewers found for this dataroom.",
      };
    }

    for (var i = 0; i < viewerIds.length; ++i) {
      // get file url from document version
      await io.runTask(
        `send-viewer-notification-${viewerIds[i].id}`,
        async () => {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/send-dataroom-notifications`,
            {
              method: "POST",
              body: JSON.stringify({
                dataroomId,
                linkId,
                dataroomDocumentId,
                viewerId: viewerIds[i].id,
                senderUserId,
              }),
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
              },
            },
          );

          if (!response.ok) {
            await io.logger.error("Failed to send dataroom notification", {
              payload,
              viewerId: viewerIds[i],
            });
            return;
          }

          const { message } = (await response.json()) as {
            message: string;
          };

          await io.logger.info("Invitation sent", { message, payload });
          return { message };
        },
      );
    }

    return {
      success: true,
      message: "Successfully sent view invitations",
    };
  },
});
