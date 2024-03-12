import { getTriggerClient } from "@/trigger";
import { log } from "@/lib/utils";

export default async function sendNotification({ viewId }: { viewId: string }) {
  const client = getTriggerClient();

  if (!client) {
    /** If client does not exist, use fetch to send notifications */
    return await fetch(
      `${process.env.NEXTAUTH_URL}/api/jobs/send-notification`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
        },
        body: JSON.stringify({ viewId: viewId }),
      },
    )
      .then(() => {})
      .catch((error) => {
        log({
          message: `Failed to fetch notifications job in _/api/views_ route. \n\n Error: ${error} \n\n*Metadata*: \`{viewId: ${viewId}}\``,
          type: "error",
          mention: true,
        });
      });
  }

  /** If client exists, use trigger to send notifications */
  return await client.sendEvent({
    name: "link.viewed",
    payload: {
      viewId: viewId,
    },
  });
}
