import prisma from "@/lib/prisma";
import { EventData } from "../webhooks/types";
import { client } from "@/trigger";

export async function handleLinkViewed(eventData: EventData) {
  try {
    // const viewerEmail = eventData.data.viewerEmail;
    const viewerEmail = eventData.viewerEmail;

    // const documentName = eventData.data.documentName;
    const documentName = eventData.documentName;

    const message = viewerEmail
      ? `${viewerEmail} viewed your ${documentName}`
      : `Someone viewed your ${documentName}`;
    const notification = await prisma.notification.create({
      data: {
        teamId: eventData.teamId,
        userId: eventData.receiverId,
        event: "LINK_VIEWED",
        message,
        linkId: eventData.link.id,
        documentId: eventData.documentId,
      },
    });

    // notify the user (via email)
    // TODO: check if user has allow email notification if yes then send the email notification
    const user = await prisma.user.findUnique({
      where: {
        id: eventData.receiverId,
      },
    });

    // check if user has enabled email notification, if yes then check if the link has enable email notification
    if (user?.isEmailNotificationEnabled) {
      // notify user via email
      if (eventData.link.enableNotification) {
        // trigger link viewed event to trigger send-notification job
        console.time("sendemail");
        await client.sendEvent({
          name: "link.viewed",
          payload: { viewId: eventData.viewId },
        });
        console.timeEnd("sendemail");
      }
    }

    return notification;
  } catch (error) {
    throw error;
  }
}
