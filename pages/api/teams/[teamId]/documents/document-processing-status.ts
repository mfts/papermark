import { NextApiResponse } from "next";

import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { documentVersionId } = req.query as { documentVersionId: string };

    const documentVersion = await prisma.documentVersion.findUnique({
      where: { id: documentVersionId },
      select: {
        numPages: true,
        hasPages: true,
        _count: { select: { pages: true } },
      },
    });

    if (!documentVersion) {
      res.status(404).end();
      return;
    }

    const status = {
      currentPageCount: documentVersion._count.pages,
      totalPages: documentVersion.numPages,
      hasPages: documentVersion.hasPages,
    };

    res.status(200).json(status);
  },
});
