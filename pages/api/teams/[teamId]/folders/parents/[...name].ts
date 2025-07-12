import { NextApiResponse } from "next";

import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId, name } = req.query as { teamId: string; name: string[] };

    let folderNames = [];

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

      for (let i = 0; i < name.length; i++) {
        const path = "/" + name.slice(0, i + 1).join("/"); // construct the materialized path

        const folder = await prisma.folder.findUnique({
          where: {
            teamId_path: {
              teamId: teamId,
              path: path,
            },
          },
          select: {
            id: true,
            parentId: true,
            name: true,
          },
        });

        if (!folder) {
          res.status(404).end("Parent Folder not found");
          return;
        }

        folderNames.push({ name: folder.name, path: path });
      }

      res.status(200).json(folderNames);
    } catch (error) {
      console.error("Request error", error);
      res.status(500).json({ error: "Error fetching folders" });
    }
  },
});
