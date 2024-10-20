import { NextApiRequest, NextApiResponse } from "next";

import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
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
    return res.status(404).end();
  }

  const status = {
    currentPageCount: documentVersion._count.pages,
    totalPages: documentVersion.numPages,
    hasPages: documentVersion.hasPages,
  };

  res.status(200).json(status);
}
