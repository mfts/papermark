import { NextApiRequest, NextApiResponse } from "next";

import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { sortItemsByIndexAndName } from "@/lib/utils/sort-items-by-index-name";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const {
      teamId,
      id: dataroomId,
      name,
    } = req.query as { teamId: string; id: string; name: string[] };

    const path = "/" + name.join("/"); // construct the materialized path

    try {
      const folder = await prisma.dataroomFolder.findUnique({
        where: {
          dataroomId_path: {
            dataroomId,
            path,
          },
        },
        select: {
          id: true,
          parentId: true,
        },
      });

      if (!folder) {
        res.status(404).end("Folder not found");
        return;
      }

      const documents = await prisma.dataroomDocument.findMany({
        where: {
          dataroomId: dataroomId,
          folderId: folder.id,
        },
        orderBy: [
          { orderIndex: "asc" },
          {
            document: {
              name: "asc",
            },
          },
        ],
        select: {
          id: true,
          dataroomId: true,
          folderId: true,
          createdAt: true,
          updatedAt: true,
          orderIndex: true,
          document: {
            select: {
              id: true,
              name: true,
              type: true,
              versions: {
                select: { id: true, hasPages: true },
              },
              isExternalUpload: true,
              _count: {
                select: {
                  views: { where: { dataroomId } },
                  versions: true,
                },
              },
            },
          },
        },
      });

      const sortedDocuments = sortItemsByIndexAndName(documents);

      res.status(200).json(sortedDocuments);
    } catch (error) {
      console.error("Request error", error);
      res
        .status(500)
        .json({ error: "Error fetching dataroom folder documents" });
    }
  },
});
