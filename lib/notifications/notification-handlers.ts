import prisma from "@/lib/prisma";
import {
  DocumentUploadedData,
  DocumentViewdData,
  EventData,
} from "../webhooks/types";
import { client } from "@/trigger";

export async function handleDocumentViewed(eventData: DocumentViewdData) {
  try {
    const viewerEmail = eventData.viewerEmail;
    const documentName = eventData.documentName;
    const message = viewerEmail
      ? `${viewerEmail} viewed your ${documentName}`
      : `Someone viewed your ${documentName}`;

    const notification = await prisma.notification.create({
      data: {
        teamId: eventData.teamId,
        userId: eventData.ownerId,
        event: "DOCUMENT_VIEWED",
        message,
        linkId: eventData.link.id,
        documentId: eventData.documentId,
      },
    });

    // notify the user (via email)
    // TODO: check if user has allow email notification if yes then send the email notification
    const user = await prisma.user.findUnique({
      where: {
        id: eventData.ownerId,
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

export async function handleDocumentUploaded(eventData: DocumentUploadedData) {
  try {
    const documentName = eventData.documentName;
    const documentOwnerName = eventData.ownerName;
    const message = `A new document ${documentName} uploaded by ${documentOwnerName}`;

    const notification = await prisma.notification.create({
      data: {
        teamId: eventData.teamId,
        userId: eventData.ownerId,
        event: "DOCUMENT_ADDED",
        message,
        documentId: eventData.documentId,
      },
    });

    return notification;
  } catch (error) {
    throw error;
  }
}
