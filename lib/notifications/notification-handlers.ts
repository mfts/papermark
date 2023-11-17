import prisma from "@/lib/prisma";
import { Event } from "@prisma/client";
import { sendViewedDocumentEmail } from "../emails/send-viewed-document";

interface IHandleLinkViewed {
  receiverId: string;
  event: Event;
  data: {
    documentName: string;
    viewerEmail: string | null;
    documentId: string;
    documentOwner: string;
  };
}

export async function handleLinkViewed(eventData: IHandleLinkViewed) {
  try {
    const viewerEmail = eventData.data.viewerEmail;
    const documentName = eventData.data.documentName;
    const message = viewerEmail
      ? `${viewerEmail} viewed your ${documentName}`
      : `Someone viewed your ${documentName}`;
    const notification = await prisma.notification.create({
      data: {
        userId: eventData.receiverId,
        event: eventData.event,
        message,
        documentId: eventData.data.documentId,
      },
    });

    // TODO: this can be offloaded to a background job in the future to save some time
    // send email to document owner that document has been viewed
    await sendViewedDocumentEmail(
      eventData.data.documentOwner,
      eventData.data.documentId,
      eventData.data.documentName,
      eventData.data.viewerEmail
    );
    return notification;
  } catch (error) {
    throw error;
  }
}
