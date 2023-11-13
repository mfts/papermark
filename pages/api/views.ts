import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { checkPassword, log } from "@/lib/utils";
import { analytics, identifyUser, trackAnalytics } from "@/lib/analytics";
import { CustomUser } from "@/lib/types";
import { sendViewedDocumentEmail } from "@/lib/emails/send-viewed-document";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // We only allow POST requests
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }
  // POST /api/views
  const { linkId, documentId, ...data } = req.body;

  const { email, password } = data as { email: string; password: string };

  // Fetch the link to verify the settings
  const link = await prisma.link.findUnique({
    where: {
      id: linkId,
    },
    select: {
      emailProtected: true,
      enableNotification: true,
      password: true,
    },
  });

  if (!link) {
    res.status(404).json({ message: "Link not found." });
    return;
  }

  // Check if email is required for visiting the link
  if (link.emailProtected) {
    if (!email || email.trim() === "") {
      res.status(400).json({ message: "Email is required." });
      return;
    }

    // You can implement more thorough email validation if required
  }

  // Check if password is required for visiting the link
  if (link.password) {
    if (!password || password.trim() === "") {
      res.status(400).json({ message: "Password is required." });
      return;
    }

    const isPasswordValid = await checkPassword(password, link.password);
    if (!isPasswordValid) {
      res.status(403).json({ message: "Invalid password." });
      return;
    }
  }

  try {
    const newView = await prisma.view.create({
      data: {
        linkId: linkId,
        viewerEmail: email,
        documentId: documentId,
      },
      include: {
        document: {
          select: {
            name: true,
            owner: {
              select: {
                email: true,
              },
            },
            versions: {
              where: { isPrimary: true },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { file: true, id: true, hasPages: true },
            },
          },
        },
      },
    });

    // TODO: cannot identify user because session is not available
    // await identifyUser((session.user as CustomUser).id);
    // await analytics.identify();
    await trackAnalytics({
      event: "Link Viewed",
      linkId: linkId,
      documentId: documentId,
      viewerId: newView.id,
      viewerEmail: email,
    });

    // TODO: this can be offloaded to a background job in the future to save some time
    // send email to document owner that document has been viewed if user has not disabled notifications
    if (link.enableNotification) {
      await sendViewedDocumentEmail(
        newView.document.owner.email as string,
        documentId,
        newView.document.name,
        email
      );
    }

    // check if document version has multiple pages, if so, return the pages
    if (newView.document.versions[0].hasPages) {
      const pages = await prisma.documentPage.findMany({
        where: {
          versionId: newView.document.versions[0].id,
        },
        orderBy: {
          pageNumber: "asc",
        },
        select: {
          file: true,
          pageNumber: true,
        },
      });

      return res.status(200).json({
        message: "View recorded",
        viewId: newView.id,
        file: null,
        pages: pages,
      });
    }

    return res.status(200).json({
      message: "View recorded",
      viewId: newView.id,
      file: newView.document.versions[0].file,
      pages: null,
    });
  } catch (error) {
    log(`Failed to record view for ${linkId}. Error: \n\n ${error}`);
    return res.status(500).json({ message: (error as Error).message });
  }
}
