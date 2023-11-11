import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { Event } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { notifySubscriber } from "@/lib/notifications/notification-service";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    // TODO: signature verification

    const { eventType, eventData } = req.body as {
      eventType: Event;
      eventData: any;
    };

    const userId = (session.user as CustomUser).id;

    const notification = await prisma.notification.create({
      data: {
        receiverId: eventData.receiverId,
        senderId: eventData.senderId ? eventData.senderId : null,
        event: eventType,
        message: eventData.message,
      },
    });

    // notify the user (in-app notification)
    notifySubscriber({ notification });

    // notify the user (via email)
    // TODO: check if user has allow email notification if yes then send the email notification
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (user?.isEmailNotificationEnabled) {
      // notify user via email
    }

    return res.status(201);
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
