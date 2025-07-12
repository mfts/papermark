import { NextApiResponse } from "next";

import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

async function handleToggleDownloadOnly(
  req: AuthenticatedRequest,
  res: NextApiResponse,
): Promise<void> {
  const { teamId, id: documentId } = req.query as {
    teamId: string;
    id: string;
  };
  const { downloadOnly } = req.body as { downloadOnly: boolean };

  try {
    // Update document
    await prisma.document.update({
      where: {
        id: documentId,
        teamId: teamId,
      },
      data: {
        downloadOnly: downloadOnly,
      },
    });

    await fetch(
      `${process.env.NEXTAUTH_URL}/api/revalidate?secret=${process.env.REVALIDATE_TOKEN}&documentId=${documentId}`,
    );

    res.status(200).json({
      message: `Document is now ${downloadOnly ? "download only" : "viewable"}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating document" });
  }
}

export default createTeamHandler({
  PATCH: handleToggleDownloadOnly,
});
