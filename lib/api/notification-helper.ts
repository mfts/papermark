import { getTriggerClient } from "@/trigger";

import { log } from "@/lib/utils";

// TODO: cleanup after removing trigger for this

export default async function sendNotification({ viewId }: { viewId: string }) {
  // const client = getTriggerClient();

  // if (!client) {
  /** If client does not exist, use fetch to send notifications */
  return await fetch(`${process.env.NEXTAUTH_URL}/api/jobs/send-notification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
    },
    body: JSON.stringify({ viewId: viewId }),
  })
    .then(() => {})
    .catch((error) => {
      log({
        message: `Failed to fetch notifications job in _/api/views_ route. \n\n Error: ${error} \n\n*Metadata*: \`{viewId: ${viewId}}\``,
        type: "error",
        mention: true,
      });
    });
  // }

  // /** If client exists, use trigger to send notifications */
  // return await client.sendEvent({
  //   name: "link.viewed",
  //   payload: {
  //     viewId: viewId,
  //   },
  // });
}

export async function sendViewerInvitation({
  dataroomId,
  linkId,
  viewerIds,
  senderUserId,
}: {
  dataroomId: string;
  linkId: string;
  viewerIds: string[];
  senderUserId: string;
}) {
  const client = getTriggerClient();

  if (!client) {
    /** If client does not exist, use fetch to send dataroom viewer invitations */
    for (var i = 0; i < viewerIds.length; ++i) {
      await fetch(
        `${process.env.NEXTAUTH_URL}/api/jobs/send-dataroom-view-invitation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
          },
          body: JSON.stringify({
            dataroomId,
            linkId,
            viewerId: viewerIds[i],
            senderUserId,
          }),
        },
      )
        .then(() => {})
        .catch((error) => {
          log({
            message: `Failed to fetch dataroom viewer invite job. \n\n Error: ${error}`,
            type: "error",
            mention: true,
          });
        });
    }
    return;
  }

  /** If client exists, use trigger to send dataroom viewer invitations */
  return await client.sendEvent({
    name: "dataroom.invite_viewer",
    payload: {
      dataroomId: dataroomId,
      linkId: linkId,
      viewerIds: viewerIds,
      senderUserId: senderUserId,
    },
  });
}
