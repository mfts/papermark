import { NextApiRequest, NextApiResponse } from "next";
import { Notification } from "@prisma/client";
import {
  handleDocumentViewed,
  handleDocumentUploaded,
  handleDocumentDeleted,
} from "@/lib/notifications/notification-handlers";
import { errorhandler } from "@/lib/errorHandler";
import { verifySignature } from "@/lib/webhooks";
import {
  DocumentDeletedData,
  DocumentUploadedData,
  DocumentViewdData,
  IWebhookTrigger,
} from "@/lib/webhooks/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    //signature verification
    const signature = req.headers["x-signature"] as string;
    if (!signature) {
      return res.status(400).end("x-signature header missing from the request");
    }

    const body = JSON.stringify(req.body);
    if (!verifySignature(body, signature)) {
      return res.status(401).end("Invalid signature");
    }

    try {
      const { eventType, eventData } = req.body as IWebhookTrigger;

      // const userId = (session.user as CustomUser).id;
      let notification: Notification | null = null;
      switch (eventType) {
        case "DOCUMENT_VIEWED":
          notification = await handleDocumentViewed(
            eventData as DocumentViewdData,
          );
          break;

        case "DOCUMENT_ADDED":
          notification = await handleDocumentUploaded(
            eventData as DocumentUploadedData,
          );
          break;

        case "DOCUMENT_DELETED":
          notification = await handleDocumentDeleted(
            eventData as DocumentDeletedData,
          );
      }

      // since the internal webhook is for notification purpose we are returning the notification that is being created
      return res.status(201).json(notification);
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
