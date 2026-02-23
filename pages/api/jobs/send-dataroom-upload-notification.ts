import { NextApiRequest, NextApiResponse } from "next";

import { sendDataroomUploadNotification } from "@/lib/emails/send-dataroom-upload-notification";
import { log } from "@/lib/utils";

export const config = {
  maxDuration: 120,
};

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (token !== process.env.INTERNAL_API_KEY) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const {
    dataroomId,
    dataroomName,
    uploaderEmail,
    documentNames,
    linkName,
    ownerEmail,
    teamMembers,
  } = req.body as {
    dataroomId: string;
    dataroomName: string;
    uploaderEmail: string | null;
    documentNames: string[];
    linkName: string;
    ownerEmail: string;
    teamMembers: string[];
    teamId: string;
  };

  try {
    await sendDataroomUploadNotification({
      ownerEmail,
      dataroomId,
      dataroomName,
      uploaderEmail,
      documentNames,
      linkName,
      teamMembers,
    });

    res.status(200).json({
      message: "Successfully sent dataroom upload notification",
    });
    return;
  } catch (error) {
    log({
      message: `Failed to send dataroom upload notification for dataroom ${dataroomId}. \n\n Error: ${error}`,
      type: "error",
      mention: true,
    });
    return res.status(500).json({ message: (error as Error).message });
  }
}
