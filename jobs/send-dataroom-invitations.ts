import { client } from "@/trigger";
import { eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";

client.defineJob({
  id: "send-dataroom-viewer-invite",
  name: "Send Dataroom Viewer Invite",
  version: "0.0.1",
  trigger: eventTrigger({
    name: "dataroom.invite_viewer",
    schema: z.object({
      dataroomId: z.string(),
      linkId: z.string(),
      viewerIds: z.array(z.string()),
      senderUserId: z.string(),
    }),
  }),
  run: async (payload, io, ctx) => {
    const { dataroomId, linkId, viewerIds, senderUserId } = payload;

    for (var i = 0; i < viewerIds.length; ++i) {
      // get file url from document version
      await io.runTask(`send-viewer-invitation-${viewerIds[i]}`, async () => {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/send-dataroom-view-invitation`,
          {
            method: "POST",
            body: JSON.stringify({
              dataroomId,
              linkId,
              viewerId: viewerIds[i],
              senderUserId,
            }),
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
            },
          },
        );

        if (!response.ok) {
          await io.logger.error("Failed to send invitation", {
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
      });
    }

    return {
      success: true,
      message: "Successfully sent view invitations",
    };
  },
});
