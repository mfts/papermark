import { NextApiResponse } from "next";

import { DocumentStorageType, Prisma } from "@prisma/client";

import { hashToken } from "@/lib/api/auth/token";
import { processDocument } from "@/lib/api/documents/process-document";
import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";
import { log } from "@/lib/utils";
import { supportsAdvancedExcelMode } from "@/lib/utils/get-content-type";

export const config = {
  // in order to enable `waitUntil` function
  supportsResponseStreaming: true,
};

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId } = req.query as { teamId: string };
    const { query, sort } = req.query as { query?: string; sort?: string };
    const userId = req.user.id;

    const usePagination = !!(query || sort);
    const page = usePagination ? Number(req.query.page) || 1 : undefined;
    const limit = usePagination ? Number(req.query.limit) || 10 : undefined;

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId: userId,
            },
          },
        },
      });

      if (!team) {
        res.status(404).end("Team not found");
        return;
      }

      let orderBy: Prisma.DocumentOrderByWithRelationInput;

      if (query || sort) {
        switch (sort) {
          case "createdAt":
            orderBy = { createdAt: "desc" };
            break;
          case "views":
            orderBy = { views: { _count: "desc" } };
            break;
          case "name":
            orderBy = { name: "asc" };
            break;
          case "links":
            orderBy = { links: { _count: "desc" } };
            break;
          default:
            orderBy = { createdAt: "desc" };
        }
      } else {
        orderBy = { createdAt: "desc" };
      }

      const totalDocuments = usePagination
        ? await prisma.document.count({
            where: {
              teamId: teamId,
              ...(query && {
                name: {
                  contains: query,
                  mode: "insensitive",
                },
              }),
              ...(!(query || sort) && {
                folderId: null,
              }),
            },
          })
        : undefined;

      const documents = await prisma.document.findMany({
        where: {
          teamId: teamId,
          ...(query && {
            name: {
              contains: query,
              mode: "insensitive",
            },
          }),
          ...(!(query || sort) && {
            folderId: null,
          }),
        },
        orderBy,
        ...(usePagination && {
          skip: ((page as number) - 1) * (limit as number),
          take: limit,
        }),
        include: {
          folder: {
            select: {
              name: true,
              path: true,
            },
          },
          ...(sort === "lastViewed" && {
            views: {
              select: { viewedAt: true },
              orderBy: { viewedAt: "desc" },
              take: 1,
            },
          }),
          _count: {
            select: {
              links: true,
              views: true,
              versions: true,
              datarooms: true,
            },
          },
        },
      });

      let documentsWithFolderList = documents;

      if (query || sort) {
        documentsWithFolderList = await Promise.all(
          documents.map(async (doc) => {
            const folderNames = [];
            const pathSegments = doc.folder?.path?.split("/") || [];

            if (pathSegments.length > 0) {
              const folders = await prisma.folder.findMany({
                where: {
                  teamId,
                  path: {
                    in: pathSegments.map((_, index) =>
                      pathSegments.slice(0, index + 1).join("/"),
                    ),
                  },
                },
                select: {
                  path: true,
                  name: true,
                },
                orderBy: {
                  path: "asc",
                },
              });
              folderNames.push(...folders.map((f) => f.name));
            }
            return { ...doc, folderList: folderNames };
          }),
        );
      }

      if ((query || sort) && sort === "lastViewed") {
        documentsWithFolderList = documentsWithFolderList.sort((a, b) => {
          const aLastView = a.views[0]?.viewedAt;
          const bLastView = b.views[0]?.viewedAt;

          if (!aLastView) return 1;
          if (!bLastView) return -1;

          return bLastView.getTime() - aLastView.getTime();
        });
      }

      if ((query || sort) && sort === "name") {
        documentsWithFolderList = documentsWithFolderList.sort((a, b) =>
          a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
        );
      }

      res.status(200).json({
        documents: documentsWithFolderList,
        ...(usePagination && {
          pagination: {
            total: totalDocuments,
            pages: Math.ceil(totalDocuments! / limit!),
            currentPage: page,
            pageSize: limit,
          },
        }),
      });
      return;
    } catch (error) {
      errorhandler(error, res);
      return;
    }
  },

  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId } = req.query as { teamId: string };

    // Check for API token first
    const authHeader = req.headers.authorization;
    let finalUserId = req.user.id;
    let token: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "");
      const hashedToken = hashToken(token);

      // Look up token in database
      const restrictedToken = await prisma.restrictedToken.findUnique({
        where: { hashedKey: hashedToken },
        select: { userId: true, teamId: true },
      });

      // Check if token exists
      if (!restrictedToken) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      // Check if token is for the correct team
      if (restrictedToken.teamId !== teamId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      finalUserId = restrictedToken.userId;
    }

    // Assuming data is an object with `name` and `description` properties
    const {
      name,
      url: fileUrl,
      storageType,
      numPages,
      type: fileType,
      folderPathName,
      contentType,
      createLink,
      fileSize,
    } = req.body as {
      name: string;
      url: string;
      storageType: DocumentStorageType;
      numPages?: number;
      type: string;
      folderPathName?: string;
      contentType: string;
      createLink?: boolean;
      fileSize?: number;
    };

    try {
      const { team } = await getTeamWithUsersAndDocument({
        teamId,
        userId: finalUserId,
      });

      const document = await processDocument({
        documentData: {
          name,
          key: fileUrl,
          storageType,
          numPages,
          supportedFileType: fileType,
          contentType,
          fileSize,
          enableExcelAdvancedMode:
            fileType === "sheet" &&
            team.enableExcelAdvancedMode &&
            supportsAdvancedExcelMode(contentType),
        },
        teamId,
        userId: finalUserId,
        teamPlan: team.plan,
        createLink,
        folderPathName,
      });

      res.status(201).json(document);
      return;
    } catch (error) {
      log({
        message: `Failed to create document. \n\n*teamId*: _${teamId}_, \n\n*file*: ${fileUrl} \n\n ${error}`,
        type: "error",
      });
      errorhandler(error, res);
      return;
    }
  },
});
