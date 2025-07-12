import { NextApiResponse } from "next";

import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createTeamHandler({
  PATCH: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { id: documentId } = req.query as {
      id: string;
    };
    const { darkMode } = req.body as { darkMode: boolean };

    try {
      const documentVersion = await prisma.documentVersion.findFirst({
        where: {
          documentId: documentId,
        },
        select: {
          file: true,
          type: true,
        },
      });

      if (!documentVersion) {
        res.status(404).json({ message: "Document version not found" });
        return;
      }

      if (documentVersion.type !== "notion") {
        res.status(400).json({ message: "Document is not a Notion document" });
        return;
      }

      const notionUrl = new URL(documentVersion.file);
      if (darkMode) {
        notionUrl.searchParams.set("mode", "dark");
      } else {
        notionUrl.searchParams.delete("mode");
      }

      // Update document version
      await prisma.documentVersion.updateMany({
        where: {
          documentId: documentId,
        },
        data: {
          file: notionUrl.toString(),
        },
      });

      await fetch(
        `${process.env.NEXTAUTH_URL}/api/revalidate?secret=${process.env.REVALIDATE_TOKEN}&documentId=${documentId}`,
      );

      res.status(200).json({
        message: `Notion document theme changed to ${darkMode ? "dark" : "light"} mode`,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error updating document" });
    }
  },
});
