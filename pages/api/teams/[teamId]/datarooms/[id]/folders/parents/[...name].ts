import { NextApiResponse } from "next";

import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const {
      id: dataroomId,
      name,
    } = req.query as { id: string; name: string[] };

    let folderNames = [];

    try {
      for (let i = 0; i < name.length; i++) {
        const path = "/" + name.slice(0, i + 1).join("/"); // construct the materialized path
        console.log("path", path);

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
