import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";

import { hashToken } from "@/lib/api/auth/token";
import { processDocument } from "@/lib/api/documents/process-document";
import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { log, serializeFileSize } from "@/lib/utils";
import { supportsAdvancedExcelMode } from "@/lib/utils/get-content-type";
import { documentUploadSchema } from "@/lib/zod/url-validation";

export const config = {
  // in order to enable `waitUntil` function
  supportsResponseStreaming: true,
};

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/documents
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId } = req.query as { teamId: string };
    const { query, sort } = req.query as { query?: string; sort?: string };
    const userId = (session.user as CustomUser).id;

    const usePagination = !!(query || sort);
    const page = usePagination ? Number(req.query.page) || 1 : undefined;
    const limit = usePagination ? Number(req.query.limit) || 10 : undefined;

    try {
      const teamAccess = await prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId: userId,
            teamId: teamId,
          },
        },
      });

      if (!teamAccess) {
        return res.status(401).end("Unauthorized");
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

      // First, get documents without expensive counts
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
        },
      });

      // Then, get counts efficiently with separate GROUP BY queries
      const documentIds = documents.map((d) => d.id);

      const [linkCounts, viewCounts, versionCounts, dataroomCounts] =
        await Promise.all([
          prisma.link.groupBy({
            by: ["documentId"],
            where: {
              documentId: { in: documentIds },
              deletedAt: null,
            },
            _count: { id: true },
          }),
          prisma.view.groupBy({
            by: ["documentId"],
            where: {
              documentId: { in: documentIds },
            },
            _count: { id: true },
          }),
          prisma.documentVersion.groupBy({
            by: ["documentId"],
            where: {
              documentId: { in: documentIds },
            },
            _count: { id: true },
          }),
          prisma.dataroomDocument.groupBy({
            by: ["documentId"],
            where: {
              documentId: { in: documentIds },
            },
            _count: { id: true },
          }),
        ]);

      // Create lookup maps for counts
      const linkCountMap = new Map(
        linkCounts.map((lc) => [lc.documentId, lc._count.id]),
      );
      const viewCountMap = new Map(
        viewCounts.map((vc) => [vc.documentId, vc._count.id]),
      );
      const versionCountMap = new Map(
        versionCounts.map((vsc) => [vsc.documentId, vsc._count.id]),
      );
      const dataroomCountMap = new Map(
        dataroomCounts.map((dc) => [dc.documentId, dc._count.id]),
      );

      // Combine documents with their counts
      const documentsWithCounts = documents.map((document) => ({
        ...document,
        _count: {
          links: linkCountMap.get(document.id) || 0,
          views: viewCountMap.get(document.id) || 0,
          versions: versionCountMap.get(document.id) || 0,
          datarooms: dataroomCountMap.get(document.id) || 0,
        },
      }));

      let documentsWithFolderList = documentsWithCounts;

      if (query || sort) {
        documentsWithFolderList = await Promise.all(
          documentsWithCounts.map(async (doc) => {
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

      return res.status(200).json({
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
    } catch (error) {
      errorhandler(error, res);
    }
  } else if (req.method === "POST") {
    // POST /api/teams/:teamId/documents
    const { teamId } = req.query as { teamId: string };

    // Check for API token first
    const authHeader = req.headers.authorization;
    let userId: string;
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
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check if token is for the correct team
      if (restrictedToken.teamId !== teamId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      userId = restrictedToken.userId;
    } else {
      // Fall back to session auth
      const session = await getServerSession(req, res, authOptions);
      if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      userId = (session.user as CustomUser).id;
    }

    // Validate request body using Zod schema for security
    const validationResult = await documentUploadSchema.safeParseAsync(
      req.body,
    );

    if (!validationResult.success) {
      log({
        message: `Document upload validation failed for teamId: ${teamId}. Errors: ${JSON.stringify(validationResult.error.errors)}`,
        type: "error",
      });
      return res.status(400).json({
        error: "Invalid document upload data",
        details: validationResult.error.errors,
      });
    }

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
    } = validationResult.data;

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId,
            },
          },
        },
        select: { plan: true, enableExcelAdvancedMode: true },
      });

      if (!team) {
        return res.status(404).end("Team not found");
      }

      const document = await processDocument({
        documentData: {
          name,
          key: fileUrl,
          storageType,
          numPages,
          supportedFileType: fileType,
          contentType: contentType || null,
          fileSize,
          enableExcelAdvancedMode:
            fileType === "sheet" &&
            team.enableExcelAdvancedMode &&
            supportsAdvancedExcelMode(contentType),
        },
        teamId,
        userId,
        teamPlan: team.plan,
        createLink,
        folderPathName,
      });

      return res.status(201).json(serializeFileSize(document));
    } catch (error) {
      log({
        message: `Failed to create document. \n\n*teamId*: _${teamId}_, \n\n*file*: ${fileUrl} \n\n ${error}`,
        type: "error",
      });
      errorhandler(error, res);
    }
  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
