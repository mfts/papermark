import { NextApiResponse } from "next";

import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { name } = req.query as { name: string[] };

    const path = "/" + name.join("/"); // construct the materialized path

    try {
      const folder = await prisma.folder.findUnique({
        where: {
          teamId_path: {
            teamId: req.team.id,
            path: path,
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

      const documents = await prisma.document.findMany({
        where: {
          teamId: req.team.id,
          folderId: folder.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          _count: {
            select: {
              links: true,
              views: true,
              versions: true,
              datarooms: true,
            },
          },
          links: {
            take: 1,
            select: { id: true },
          },
        },
      });

      res.status(200).json(documents);
    } catch (error) {
      console.error("Request error", error);
      res.status(500).json({ error: "Error fetching folders" });
    }
  },
});
