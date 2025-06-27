import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import { copyFileToBucketServer } from "@/lib/files/copy-file-to-bucket-server";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { supportsAdvancedExcelMode } from "@/lib/utils/get-content-type";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // GET /api/teams/:teamId/documents/:id/advanced-mode
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, id: docId } = req.query as { teamId: string; id: string };

    const userId = (session.user as CustomUser).id;

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId,
            },
          },
        },
        select: {
          id: true,
        },
      });

      if (!team) {
        return res.status(401).end("Unauthorized");
      }

      const documentVersion = await prisma.documentVersion.findFirst({
        where: {
          documentId: docId,
          isPrimary: true,
          type: "sheet",
        },
        select: {
          id: true,
          file: true,
          storageType: true,
          contentType: true,
        },
      });

      if (!documentVersion) {
        return res.status(404).end("Document not found");
      }

      if (!supportsAdvancedExcelMode(documentVersion.contentType)) {
        return res.status(400).json({
          message:
            "Advanced mode is only available for Excel files (.xls, .xlsx, .xlsm).",
        });
      }

      await copyFileToBucketServer({
        filePath: documentVersion.file,
        storageType: documentVersion.storageType,
        teamId,
      });

      const documentPromise = prisma.document.update({
        where: { id: docId },
        data: { advancedExcelEnabled: true },
      });

      const documentVersionPromise = prisma.documentVersion.update({
        where: { id: documentVersion.id },
        data: { numPages: 1 },
      });

      await Promise.all([documentPromise, documentVersionPromise]);

      await fetch(
        `${process.env.NEXTAUTH_URL}/api/revalidate?secret=${process.env.REVALIDATE_TOKEN}&documentId=${docId}`,
      );

      return res.status(200).json({
        message: `Document updated to advanced Excel mode!`,
      });
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
