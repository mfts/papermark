import { NextApiRequest, NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { id: dataroomId, viewId } = req.query as {
      id: string;
      viewId: string;
    };

    try {
      const [documentViews, uploadedDocumentViews] = await Promise.all([
        prisma.view.findMany({
          where: {
            dataroomViewId: viewId,
            dataroomId: dataroomId,
            viewType: "DOCUMENT_VIEW",
          },
          orderBy: {
            viewedAt: "asc",
          },
          select: {
            id: true,
            viewedAt: true,
            downloadedAt: true,
            document: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        prisma.documentUpload.findMany({
          where: {
            viewId: viewId,
          },
          select: {
            uploadedAt: true,
            documentId: true,
            originalFilename: true,
          },
        }),
      ]);

      return res.status(200).json({ documentViews, uploadedDocumentViews });
    } catch (error) {
      errorhandler(error, res);
    }
  },
});
