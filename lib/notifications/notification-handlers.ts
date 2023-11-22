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
    link: {
      enableNotification: boolean;
    };
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
      // TODO: this can be offloaded to a background job in the future to save some time
      // send email to document owner that document has been viewed
      if (eventData.data.link.enableNotification) {
        await sendViewedDocumentEmail(
          eventData.data.documentOwner,
          eventData.data.documentId,
          eventData.data.documentName,
          eventData.data.viewerEmail,
        );
      }
    }

    return notification;
  } catch (error) {
    throw error;
  }
}
