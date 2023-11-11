import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { Event } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { CustomUser } from "@/lib/types";

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

    await prisma.notificaiton.create({
      data: {
        receiverId: userId,
        senderId: eventData.senderId ? eventData.senderId : null,
        event: eventType,
        message: eventData.message,
      },
    });

    return res.status(201);
  }
}
