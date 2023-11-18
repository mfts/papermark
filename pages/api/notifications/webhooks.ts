import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { Event } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { handleLinkViewed } from "@/lib/notifications/notification-handlers";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // const session = await getServerSession(req, res, authOptions);
    // if (!session) {
    //   return res.status(401).end("Unauthorized");
    // }

    // TODO: signature verification

    try {
      const { eventType, eventData } = req.body as {
        eventType: Event;
        eventData: any;
      };

      // const userId = (session.user as CustomUser).id;

      switch (eventType) {
        case "LINKED_VIEWED":
          handleLinkViewed(eventData);
          break;

        // TODO: other events like Team created, Team member added, etc.
      }

      // notify the user (via email)
      // TODO: check if user has allow email notification if yes then send the email notification
      const user = await prisma.user.findUnique({
        where: {
          id: eventData.receiverId,
        },
      });

      if (user?.isEmailNotificationEnabled) {
        // notify user via email
      }

      return res.status(201).json("hello");
    } catch (error) {
      console.log(error as Error);
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
