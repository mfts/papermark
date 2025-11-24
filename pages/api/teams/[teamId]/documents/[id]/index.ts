import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth/next";

import { TeamError, errorhandler } from "@/lib/errorHandler";
import { deleteFile } from "@/lib/files/delete-file-server";
import prisma from "@/lib/prisma";
import { ratelimit } from "@/lib/redis";
import { CustomUser } from "@/lib/types";
import { serializeFileSize } from "@/lib/utils";

import { authOptions } from "../../../../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/documents/:id
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { teamId, id: docId } = req.query as { teamId: string; id: string };

    const userId = (session.user as CustomUser).id;

    try {
      // Per-user, per-document rate limit to prevent abuse
      // Default: 120 requests per minute per user per document
      const { success, limit, remaining, reset } = await ratelimit(
        120,
        "1 m",
      ).limit(`doc:${docId}:team:${teamId}:user:${userId}`);

      res.setHeader("X-RateLimit-Limit", limit.toString());
      res.setHeader("X-RateLimit-Remaining", remaining.toString());
      res.setHeader("X-RateLimit-Reset", reset.toString());
      if (!success) {
        return res.status(429).json({ error: "Too many requests" });
      }

      // First verify user has access to the team (lightweight query)
      const teamAccess = await prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId: userId,
            teamId: teamId,
          },
        },
        select: { teamId: true },
      });

      if (!teamAccess) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Then fetch the specific document with its relationships (targeted query)
      const document = await prisma.document.findUnique({
        where: {
          id: docId,
          teamId,
        },
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
      });

      if (!document || !document.versions || document.versions.length === 0) {
        return res.status(404).json({
          error: "Not Found",
          message: "The requested document does not exist",
        });
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

      return res
        .status(200)
        .json(serializeFileSize({ ...document, hasPageLinks }));
    } catch (error) {
      if (error instanceof TeamError) {
        return res.status(404).json({
          error: "Not Found",
          message: error.message,
        });
      }
      errorhandler(error, res);
    }
  } else if (req.method === "PUT") {
    // PUT /api/teams/:teamId/document/:id
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
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
      return res.status(404).json({ message: "Document not found" });
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
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { teamId, id: docId } = req.query as { teamId: string; id: string };

    const userId = (session.user as CustomUser).id;

    try {
      const teamAccess = await prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId: userId,
            teamId: teamId,
          },
        },
        select: {
          role: true,
        },
      });
      if (!teamAccess) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (teamAccess.role !== "ADMIN" && teamAccess.role !== "MANAGER") {
        return res.status(403).json({
          message:
            "You are not permitted to perform this action. Only admin and managers can delete documents.",
        });
      }

      const documentVersions = await prisma.document.findUnique({
        where: {
          id: docId,
          teamId: teamId,
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
        return res.status(404).json({ message: "Document not found" });
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

      return res.status(204).end(); // 204 No Content response for successful deletes
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow GET, PUT and DELETE requests
    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return res
      .status(405)
      .json({ message: `Method ${req.method} Not Allowed` });
  }
}
