import { NextApiResponse } from "next";

import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId, name } = req.query as { teamId: string; name: string[] };

    const path = "/" + name.join("/"); // construct the materialized path

    try {
      // Check if the user is part of the team
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId: req.user.id,
            },
          },
        },
      });

      if (!team) {
        res.status(401).end("Unauthorized");
        return;
      }

      const parentFolder = await prisma.folder.findUnique({
        where: {
          teamId_path: {
            teamId: teamId,
            path: path,
          },
        },
        select: {
          id: true,
          parentId: true,
        },
      });

      if (!parentFolder) {
        res.status(404).end("Parent Folder not found");
        return;
      }

      const folders = await prisma.folder.findMany({
        where: {
          teamId: teamId,
          parentId: parentFolder.id,
        },
        orderBy: {
          name: "asc",
        },
        include: {
          _count: {
            select: { documents: true, childFolders: true },
          },
        },
      });

      res.status(200).json(folders);
    } catch (error) {
      console.error("Request error", error);
      res.status(500).json({ error: "Error fetching folders" });
    }
  },
});
