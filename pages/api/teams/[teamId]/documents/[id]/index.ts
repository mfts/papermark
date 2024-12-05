import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import { deleteFile } from "@/lib/files/delete-file-server";
import prisma from "@/lib/prisma";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../../../../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/documents/:id
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, id: docId } = req.query as { teamId: string; id: string };

    const userId = (session.user as CustomUser).id;

    try {
      const { document } = await getTeamWithUsersAndDocument({
        teamId,
        userId,
        docId,
        options: {
          include: {
            // Get the latest primary version of the document
            versions: {
              where: { isPrimary: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      });

      if (!document || !document.versions || document.versions.length === 0) {
        return res.status(404).end("Document not found");
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
      // if (document.ownerId !== (session.user as CustomUser).id) {
      //   return res.status(401).end("Unauthorized to access this document");
      // }

      return res.status(200).json({ ...document, hasPageLinks });
    } catch (error) {
      errorhandler(error, res);
    }
  } else if (req.method === "PUT") {
    // PUT /api/teams/:teamId/document/:id
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }
    const userId = (session.user as CustomUser).id;
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
              userId: userId,
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
      return res.status(404).end("Document not found");
    }

    return res.status(200).json({
      message: "Document moved successfully",
      newPath: document.folder?.path,
      oldPath: currentPathName,
    });
  } else if (req.method === "DELETE") {
    // DELETE /api/teams/:teamId/document/:id
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const { teamId, id: docId } = req.query as { teamId: string; id: string };

    const userId = (session.user as CustomUser).id;

    try {
      const documentVersions = await prisma.document.findUnique({
        where: {
          id: docId,
          teamId: teamId,
          team: {
            users: {
              some: {
                // role: { in: ["ADMIN", "MANAGER"] },
                userId: userId,
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
        return res.status(404).end("Document not found");
      }

      //if it is not notion document then only delete the document from storage
      if (documentVersions.type !== "notion") {
        // delete the files from storage
        for (const version of documentVersions.versions) {
          await deleteFile({ type: version.storageType, data: version.file });
        }
      }

      // delete the document from database
      await prisma.document.delete({
        where: {
          id: docId,
        },
      });

      return res.status(204).end(); // 204 No Content response for successful deletes
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow GET, PUT and DELETE requests
    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
