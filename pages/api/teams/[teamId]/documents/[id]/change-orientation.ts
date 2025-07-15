import { NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createTeamHandler({
  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { id: docId } = req.query as { id: string };
    const { versionId, isVertical } = req.body as {
      versionId: string;
      isVertical: boolean;
    };

    try {
      // Verify the document belongs to the team (middleware already verified team access)
      const document = await prisma.document.findFirst({
        where: {
          id: docId,
          teamId: req.team?.id,
        },
        select: {
          id: true,
        },
      });

      if (!document) {
        res.status(401).end("Unauthorized");
        return;
      }

      await prisma.documentVersion.update({
        where: {
          id: versionId,
        },
        data: {
          isVertical,
        },
      });

      await fetch(
        `${process.env.NEXTAUTH_URL}/api/revalidate?secret=${process.env.REVALIDATE_TOKEN}&documentId=${docId}`,
      );

      res.status(200).json({
        message: `Document orientation changed to ${isVertical ? "portrait" : "landscape"}!`,
      });
    } catch (error) {
      errorhandler(error, res);
    }
  },
});
