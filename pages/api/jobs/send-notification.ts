import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { sendViewedDocumentEmail } from "@/lib/emails/send-viewed-document";
import { log } from "@/lib/utils";

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

  const { viewId } = req.body as {
    viewId: string;
  };

  let view: {
    viewerEmail: string | null;
    linkId: string;
    document: {
      id: string;
      name: string;
      owner: {
        id: string;
        email: string | null;
      };
    } | null;
  } | null;

  try {
    // Fetch the link to verify the settings
    view = await prisma.view.findUnique({
      where: {
        id: viewId,
      },
      select: {
        viewerEmail: true,
        linkId: true,
        document: {
          select: {
            id: true,
            name: true,
            owner: {
              select: {
                id: true,
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
  } catch (error) {
    log({
      message: `Failed to find view for viewId: ${viewId}. \n\n Error: ${error}`,
      type: "error",
      mention: true,
    });
    res.status(500).json({ message: (error as Error).message });
    return;
  }

  // POST /api/jobs/send-notification
  try {
    // send email to document owner that document
    await sendViewedDocumentEmail({
      ownerEmail: view.document!.owner.email,
      documentId: view.document!.id,
      documentName: view.document!.name,
      viewerEmail: view.viewerEmail,
    });

    res.status(200).json({ message: "Successfully sent notification", viewId });
    return;
  } catch (error) {
    log({
      message: `Failed to send email in _/api/views_ route for linkId: ${view.linkId}. \n\n Error: ${error} \n\n*Metadata*: \`{ownerId: ${view.document!.owner.id}, viewId: ${viewId}}\``,
      type: "error",
      mention: true,
    });
    return res.status(500).json({ message: (error as Error).message });
  }
}
