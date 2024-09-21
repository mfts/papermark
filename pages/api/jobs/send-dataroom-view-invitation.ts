import { NextApiRequest, NextApiResponse } from "next";

import { sendDataroomViewerInvite } from "@/lib/emails/send-dataroom-viewer-invite";
import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";

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

  const { linkId, dataroomId, viewerId, senderUserId } = req.body as {
    linkId: string;
    dataroomId: string;
    viewerId: string;
    senderUserId: string;
  };

  let viewer: { email: string; dataroom: { name: string } | null } | null =
    null;

  try {
    // Fetch the link to verify the settings
    viewer = await prisma.viewer.findUnique({
      where: {
        id: viewerId,
      },
      select: {
        email: true,
        dataroom: {
          select: {
            name: true,
          },
        },
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

  // POST /api/jobs/send-datarooom-view-invitation
  try {
    const user = await prisma.user.findUnique({
      where: { id: senderUserId },
      select: { email: true },
    });

    if (!user) {
      res.status(404).json({ message: "Sender not found." });
      return;
    }

    // send email to document owner that document
    await sendDataroomViewerInvite({
      dataroomName: viewer.dataroom?.name ?? "",
      senderEmail: user.email!,
      to: viewer.email,
      url: `${process.env.NEXT_PUBLIC_MARKETING_URL}/view/${linkId}?email=${encodeURIComponent(viewer.email)}`,
    });

    res
      .status(200)
      .json({ message: "Successfully sent view invitation", viewerId });
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
