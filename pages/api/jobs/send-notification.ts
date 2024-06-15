import { NextApiRequest, NextApiResponse } from "next";

import { sendViewedDataroomEmail } from "@/lib/emails/send-viewed-dataroom";
import { sendViewedDocumentEmail } from "@/lib/emails/send-viewed-document";
import prisma from "@/lib/prisma";
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
    viewType: "DOCUMENT_VIEW" | "DATAROOM_VIEW";
    viewerEmail: string | null;
    linkId: string;
    document: {
      teamId: string | null;
      id: string;
      name: string;
      owner: {
        id: string;
        email: string | null;
      };
    } | null;
    dataroom: {
      teamId: string | null;
      id: string;
      name: string;
    } | null;
  } | null;

  try {
    // Fetch the view with data
    view = await prisma.view.findUnique({
      where: {
        id: viewId,
      },
      select: {
        viewType: true,
        viewerEmail: true,
        linkId: true,
        document: {
          select: {
            teamId: true,
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
        dataroom: {
          select: {
            teamId: true,
            id: true,
            name: true,
          },
        },
      },
    });

    if (!view) {
      res.status(404).json({ message: "View not found." });
      return;
    }
  } catch (error) {
    log({
      message: `Failed to find document / dataroom view for viewId: ${viewId}. \n\n Error: ${error}`,
      type: "error",
      mention: true,
    });
    res.status(500).json({ message: (error as Error).message });
    return;
  }

  // Get all team members who are admins or managers to be notified
  const users = await prisma.userTeam.findMany({
    where: {
      role: { in: ["ADMIN", "MANAGER"] },
      teamId:
        view.viewType === "DOCUMENT_VIEW"
          ? view.document!.teamId!
          : view.dataroom!.teamId!,
    },
    select: {
      role: true,
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  // POST /api/jobs/send-notification
  try {
    if (view.viewType === "DOCUMENT_VIEW") {
      // send email to document owner that document
      await sendViewedDocumentEmail({
        ownerEmail: view.document!.owner.email,
        documentId: view.document!.id,
        documentName: view.document!.name,
        viewerEmail: view.viewerEmail,
        teamMembers: users
          .map((user) => user.user.email!)
          .filter((email) => email !== view.document!.owner.email),
      });
    } else {
      // prettier-ignore
      const adminEmail = users
        .find((user) => user.role === "ADMIN")?.user.email;
      // send email to dataroom owner that dataroom
      await sendViewedDataroomEmail({
        ownerEmail: adminEmail!,
        dataroomId: view.dataroom!.id,
        dataroomName: view.dataroom!.name,
        viewerEmail: view.viewerEmail,
        teamMembers: users
          .map((user) => user.user.email!)
          .filter((email) => email !== adminEmail),
      });
    }

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
