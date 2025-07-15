import { NextApiResponse } from "next";

import { TeamError, errorhandler } from "@/lib/errorHandler";
import { deleteFile } from "@/lib/files/delete-file-server";
import {
  AuthenticatedRequest,
  createAuthenticatedHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";

export default createAuthenticatedHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId, id: docId } = req.query as { teamId: string; id: string };

    try {
      const { document } = await getTeamWithUsersAndDocument({
        teamId,
        userId: req.user.id,
        docId,
        options: {
          include: {
            // Get the latest primary version of the document
            versions: {
              where: { isPrimary: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
            folder: {
              select: {
                name: true,
                path: true,
              },
            },
            datarooms: {
              select: {
                dataroom: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                folder: {
                  select: {
                    id: true,
                    name: true,
                    path: true,
                  },
                },
              },
            },
          },
        },
      });

      if (!document || !document.versions || document.versions.length === 0) {
        res.status(404).json({
          error: "Not Found",
          message: "The requested document does not exist",
        });
        return;
      }

      const pages = await prisma.documentPage.findMany({
        where: {
          versionId: document.versions[0].id,
        },
        select: {
          pageLinks: true,
        },
      });

      const hasPageLinks = pages.some(
        (page) =>
          page.pageLinks &&
          Array.isArray(page.pageLinks) &&
          (page.pageLinks as any[]).length > 0,
      );

      // Check that the user is owner of the document, otherwise return 401
      // if (document.ownerId !== req.user.id) {
      //   res.status(401).end("Unauthorized to access this document");
      //   return;
      // }

      res.status(200).json({ ...document, hasPageLinks });
    } catch (error) {
      if (error instanceof TeamError) {
        res.status(404).json({
          error: "Not Found",
          message: error.message,
        });
        return;
      }
      errorhandler(error, res);
    }
  },
  PUT: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId, id: docId } = req.query as { teamId: string; id: string };
    const { folderId, currentPathName } = req.body as {
      folderId: string;
      currentPathName: string;
    };

    const document = await prisma.document.update({
      where: {
        id: docId,
        teamId: teamId,
        team: {
          users: {
            some: {
              role: "ADMIN",
              userId: req.user.id,
            },
          },
        },
      },
      data: {
        folderId: folderId,
      },
      select: {
        folder: {
          select: {
            path: true,
          },
        },
      },
    });

    if (!document) {
      res.status(404).end("Document not found");
      return;
    }

    res.status(200).json({
      message: "Document moved successfully",
      newPath: document.folder?.path,
      oldPath: currentPathName,
    });
  },
  DELETE: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId, id: docId } = req.query as { teamId: string; id: string };

    try {
      const documentVersions = await prisma.document.findUnique({
        where: {
          id: docId,
          teamId: teamId,
          team: {
            users: {
              some: {
                // role: { in: ["ADMIN", "MANAGER"] },
                userId: req.user.id,
              },
            },
          },
        },
        include: {
          versions: {
            select: {
              id: true,
              file: true,
              type: true,
              storageType: true,
            },
          },
        },
      });

      if (!documentVersions) {
        res.status(404).end("Document not found");
        return;
      }

      //if it is not notion document then only delete the document from storage
      if (documentVersions.type !== "notion") {
        // delete the files from storage
        for (const version of documentVersions.versions) {
          await deleteFile({
            type: version.storageType,
            data: version.file,
            teamId,
          });
        }
      }

      // delete the document from database
      await prisma.document.delete({
        where: {
          id: docId,
        },
      });

      res.status(204).end(); // 204 No Content response for successful deletes
    } catch (error) {
      errorhandler(error, res);
    }
  },
});
