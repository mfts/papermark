import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/documents/hidden
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId } = req.query as { teamId: string };
    const userId = (session.user as CustomUser).id;

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

      // Fetch root-level hidden folders (folders whose parent is not hidden)
      // This prevents showing nested hidden folders whose parents are already shown
      const hiddenFolders = await prisma.folder.findMany({
        where: {
          teamId: teamId,
          hiddenInAllDocuments: true,
          // Only show root-level hidden folders (parent is null or parent is not hidden)
          OR: [
            { parentId: null },
            {
              parentFolder: {
                hiddenInAllDocuments: false,
              },
            },
          ],
        },
        include: {
          _count: {
            select: {
              documents: true,
              childFolders: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Fetch root-level hidden documents (documents not in a hidden folder)
      // Only show documents that are directly hidden, not documents in hidden folders
      const hiddenDocuments = await prisma.document.findMany({
        where: {
          teamId: teamId,
          hiddenInAllDocuments: true,
          // Only show documents that are either:
          // 1. In no folder (root level)
          // 2. In a folder that is NOT hidden (document was individually hidden)
          OR: [
            { folderId: null },
            {
              folder: {
                hiddenInAllDocuments: false,
              },
            },
          ],
        },
        include: {
          folder: {
            select: {
              name: true,
              path: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Get counts for documents
      const documentIds = hiddenDocuments.map((d) => d.id);

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
      const documentsWithCounts = hiddenDocuments.map((document) => ({
        ...document,
        _count: {
          links: linkCountMap.get(document.id) || 0,
          views: viewCountMap.get(document.id) || 0,
          versions: versionCountMap.get(document.id) || 0,
          datarooms: dataroomCountMap.get(document.id) || 0,
        },
      }));

      return res.status(200).json({
        folders: hiddenFolders,
        documents: documentsWithCounts,
      });
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
