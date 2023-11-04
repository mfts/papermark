import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { getExtension, log } from "@/lib/utils";
import { identifyUser, trackAnalytics } from "@/lib/analytics";
import { client } from "@/trigger";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // GET /api/documents
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    try {
      const webhooks = await prisma.webhook.findMany({
        where: {
          ownerId: (session.user as CustomUser).id,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          document: true,
        },
      });

      res.status(200).json(webhooks);
    } catch (error) {
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else if (req.method === "POST") {
    // POST /api/documents
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    // Assuming data is an object with `name` and `description` properties
    const { target, events, documentId } = req.body;

    // Get the file extension and save it as the type

    // You could perform some validation here

    try {
      // Save data to the database
      const webhook = await prisma.webhook.create({
        data: {
          target,
          events,
          documentId,
          ownerId: (session.user as CustomUser).id,
        },
        include: {
          document: true,
        },
      });

      // calculate the path of the page where the document was added

      await identifyUser((session.user as CustomUser).id);

      // trigger document uploaded event to trigger convert-pdf-to-image job

      res.status(201).json(webhook);
    } catch (error) {
      log(`Failed to create webhook. Error: \n\n ${error}`);
      res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
