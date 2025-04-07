import { NextApiRequest, NextApiResponse } from "next";

import { sendDataroomNotification } from "@/lib/emails/send-dataroom-notification";
import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";
import { generateUnsubscribeUrl } from "@/lib/utils/unsubscribe";

export const config = {
  maxDuration: 120,
};

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // We only allow POST requests
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  // Extract the API Key from the Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1]; // Assuming the format is "Bearer [token]"

  // Check if the API Key matches
  if (token !== process.env.INTERNAL_API_KEY) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const {
    linkUrl,
    dataroomId,
    dataroomDocumentId,
    viewerId,
    senderUserId,
    teamId,
  } = req.body as {
    linkUrl: string;
    dataroomId: string;
    dataroomDocumentId: string;
    viewerId: string;
    senderUserId: string;
    teamId: string;
  };

  let viewer: { email: string } | null = null;

  try {
    // Fetch the link to verify the settings
    viewer = await prisma.viewer.findUnique({
      where: {
        id: viewerId,
        teamId,
      },
      select: {
        email: true,
      },
    });

    if (!viewer) {
      res.status(404).json({ message: "Viewer not found." });
      return;
    }
  } catch (error) {
    log({
      message: `Failed to find viewer for viewerId: ${viewerId}. \n\n Error: ${error}`,
      type: "error",
      mention: true,
    });
    res.status(500).json({ message: (error as Error).message });
    return;
  }

  // POST /api/jobs/send-datarooom-notification
  try {
    // Fetch the document to verify the settings
    const document = await prisma.dataroomDocument.findUnique({
      where: {
        id: dataroomDocumentId,
        dataroomId: dataroomId,
      },
      select: {
        document: {
          select: {
            name: true,
          },
        },
        dataroom: {
          select: {
            name: true,
          },
        },
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: senderUserId },
      select: { email: true },
    });

    if (!user) {
      res.status(404).json({ message: "Sender not found." });
      return;
    }

    const unsubscribeUrl = generateUnsubscribeUrl({
      viewerId,
      dataroomId,
      teamId,
    });

    await sendDataroomNotification({
      dataroomName: document?.dataroom?.name || "",
      documentName: document?.document?.name || "",
      senderEmail: user.email!,
      to: viewer.email!,
      url: linkUrl,
      unsubscribeUrl,
    });

    res.status(200).json({
      message: "Successfully sent dataroom change notification",
      viewerId,
    });
    return;
  } catch (error) {
    log({
      message: `Failed to send invite email for dataroom ${dataroomId} to viewer: ${viewerId}. \n\n Error: ${error} \n\n*Metadata*: \`{dataroomId: ${dataroomId}, viewerId: ${viewerId}}\``,
      type: "error",
      mention: true,
    });
    return res.status(500).json({ message: (error as Error).message });
  }
}
