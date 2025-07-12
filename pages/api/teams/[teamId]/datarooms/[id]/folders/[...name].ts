import { NextApiResponse } from "next";

import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // GET /api/teams/:teamId/datarooms/:id/folders/:name
  const {
    teamId,
    id: dataroomId,
    name,
  } = req.query as { teamId: string; id: string; name: string[] };

  const path = "/" + name.join("/"); // construct the materialized path

  try {
    const parentFolder = await prisma.dataroomFolder.findUnique({
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

    if (!parentFolder) {
      res.status(404).end("Parent Folder not found");
      return;
    }

    const folders = await prisma.dataroomFolder.findMany({
      where: {
        dataroomId,
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
}

export default createTeamHandler({
  GET: handler,
});
