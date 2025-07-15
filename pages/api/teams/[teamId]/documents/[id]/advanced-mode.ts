import { NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import { copyFileToBucketServer } from "@/lib/files/copy-file-to-bucket-server";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { supportsAdvancedExcelMode } from "@/lib/utils/get-content-type";

export default createTeamHandler({
  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { id: docId } = req.query as { id: string };

    try {
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
        res.status(404).end("Document not found");
        return;
      }

      if (!supportsAdvancedExcelMode(documentVersion.contentType)) {
        res.status(400).json({
          message:
            "Advanced mode is only available for Excel files (.xls, .xlsx, .xlsm).",
        });
        return;
      }

      await copyFileToBucketServer({
        filePath: documentVersion.file,
        storageType: documentVersion.storageType,
        teamId: req.team!.id,
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

      res.status(200).json({
        message: `Document updated to advanced Excel mode!`,
      });
    } catch (error) {
      errorhandler(error, res);
    }
  },
});
