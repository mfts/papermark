import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { Event, Notification } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { handleLinkViewed } from "@/lib/notifications/notification-handlers";
import { errorhandler } from "@/lib/errorHandler";
import { verifySignature } from "@/lib/webhooks";

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
      const { eventType, eventData } = req.body as {
        eventType: Event;
        eventData: any;
      };

      // const userId = (session.user as CustomUser).id;
      let notification: Notification | null = null;
      switch (eventType) {
        case "LINK_VIEWED":
          notification = await handleLinkViewed(eventData);
          break;

        // TODO: other events like Team created, Team member added, etc.
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
