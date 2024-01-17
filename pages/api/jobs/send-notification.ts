import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { sendViewedDocumentEmail } from "@/lib/emails/send-viewed-document";

export const config = {
  maxDuration: 60,
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

  // POST /api/jobs/send-notification
  try {
    const { viewId } = req.body as {
      viewId: string;
    };

    // Fetch the link to verify the settings
    const view = await prisma.view.findUnique({
      where: {
        id: viewId,
      },
      select: {
        viewerEmail: true,
        document: {
          select: {
            id: true,
            name: true,
            owner: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    if (!view) {
      res.status(404).json({ message: "View / Document not found." });
      return;
    }

    // send email to document owner that document
    await sendViewedDocumentEmail({
      email: view.document.owner.email as string,
      documentId: view.document.id,
      documentName: view.document.name,
      viewerEmail: view.viewerEmail,
    });

    res.status(200).json({ message: "Successfully sent notification", viewId });
    return;
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
}
