import { NextApiResponse } from "next";

import { DocumentVersion } from "@prisma/client";

import { errorhandler } from "@/lib/errorHandler";
import { copyFileServer } from "@/lib/files/copy-file-server";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createTeamHandler({
  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // POST /api/teams/:teamId/documents/:id/duplicate
    const { id: docId } = req.query as { id: string };

    try {
      const document = await prisma.document.findFirst({
        where: {
          id: docId,
          teamId: req.team?.id,
        },
        include: {
          versions: {
            where: { isPrimary: true },
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              pages: true,
            },
          },
        },
      });

      if (!document) {
        res.status(404).end("Document not found");
        return;
      }

      const { documentId, ...documentVersion } = document.versions[0];

      const { type, data } = await copyFileServer({
        teamId: req.team!.id,
        filePath: documentVersion.file,
        fileName: document.name,
        storageType: documentVersion.storageType,
      });

      await prisma.document.create({
        data: {
          ...document,
          name: `${document.name} (Copy)`,
          id: undefined,
          teamId: req.team!.id,
          ownerId: req.user.id,
          assistantEnabled: false,
          createdAt: undefined,
          updatedAt: undefined,
          file: document.file.replace(data?.fromLocation!, data?.toLocation!),
          versions: {
            create: {
              ...documentVersion,
              id: undefined,
              versionNumber: 1,
              createdAt: undefined,
              updatedAt: undefined,
              fileId: undefined,
              file: documentVersion.file.replace(
                data?.fromLocation!,
                data?.toLocation!,
              ),
              pages: {
                createMany: {
                  data: documentVersion.pages.map((page) => ({
                    ...page,
                    id: undefined,
                    file: page.file.replace(
                      data?.fromLocation!,
                      data?.toLocation!,
                    ),
                    metadata: page.metadata ?? {},
                    pageLinks: page.pageLinks ?? [],
                    versionId: undefined,
                    createdAt: undefined,
                    updatedAt: undefined,
                  })),
                },
              },
            },
          },
        },
      });

      res.status(200).json({
        message: "Document duplicated successfully!",
      });
    } catch (error) {
      errorhandler(error, res);
    }
  },
});
