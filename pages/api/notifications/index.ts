import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import {
  subscribeToNotification,
  unsubscribeToNotification,
} from "@/lib/notifications/notification-service";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    res.writeHead(200, {
      connection: "keep-alive",
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    });

    const userId = (session.user as CustomUser).id;

    const notifications = await prisma.notificaiton.findMany({
      where: {
        receiverId: userId,
      },
    });

    const sendNotification = () => {
      res.write(JSON.stringify(notifications));
    };

    subscribeToNotification({ userId, sendNotification });

    req.on("close", () => {
      unsubscribeToNotification({ userId, sendNotification });
      res.end();
    });
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
