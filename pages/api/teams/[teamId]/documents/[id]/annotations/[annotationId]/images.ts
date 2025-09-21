import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const {
    teamId,
    id: docId,
    annotationId,
  } = req.query as {
    teamId: string;
    id: string;
    annotationId: string;
  };

  const userId = (session.user as CustomUser).id;

  try {
    const teamAccess = await prisma.userTeam.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    if (!teamAccess) {
      return res.status(401).end("Unauthorized");
    }

    // Verify user has access to document
    const document = await prisma.document.findUnique({
      where: {
        id: docId,
        teamId,
      },
      select: { id: true },
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Verify annotation exists and belongs to document
    const annotation = await prisma.documentAnnotation.findFirst({
      where: {
        id: annotationId,
        documentId: docId,
        teamId,
      },
    });

    if (!annotation) {
      return res.status(404).json({ error: "Annotation not found" });
    }

    const { filename, url, size, mimeType } = req.body;

    if (!filename || !url || !mimeType) {
      return res.status(400).json({
        error: "Missing required fields: filename, url, mimeType",
      });
    }

    // Validate file type
    if (!mimeType.startsWith("image/")) {
      return res.status(400).json({ error: "Only image files are allowed" });
    }

    // Save image record to database
    const image = await prisma.annotationImage.create({
      data: {
        filename,
        url,
        size,
        mimeType,
        annotationId,
      },
    });

    return res.status(201).json(image);
  } catch (error) {
    log({
      message: `Failed to upload image for annotation: _${annotationId}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, userId: ${userId}, docId: ${docId}}\``,
      type: "error",
    });
    errorhandler(error, res);
  }
}
