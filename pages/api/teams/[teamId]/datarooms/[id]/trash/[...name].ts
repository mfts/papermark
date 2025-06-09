import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { ItemType } from "@prisma/client";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/datarooms/:id/folders/:name
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const userId = (session.user as CustomUser).id;
    const {
      teamId,
      id: dataroomId,
      name,
    } = req.query as { teamId: string; id: string; name: string[] };

    const path = "/" + name.join("/"); // construct the materialized path

    try {
      // Check if the user is part of the team
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
        return res.status(401).end("Unauthorized");
      }
      const parentFolder = await prisma.trashItem.findFirst({
        where: {
          trashPath: path,
          dataroomId,
          itemType: ItemType.DATAROOM_FOLDER,
        },
        select: {
          id: true,
          dataroomFolderId: true,
        },
      });

      if (!parentFolder) {
        return res.status(404).end("Parent Folder not found");
      }

      const folders = await prisma.trashItem.findMany({
        where: {
          dataroomId,
          parentId: parentFolder.dataroomFolderId,
          itemType: {
            in: [ItemType.DATAROOM_FOLDER, ItemType.DATAROOM_DOCUMENT],
          },
        },
        orderBy: [
          { deletedAt: "desc" },
          { name: "asc" }
        ],
        select: {
          id: true,
          parentId: true,
          trashPath: true,
          fullPath: true,
          itemType: true,
          itemId: true,
          dataroomFolder: true,
          dataroomDocument: {
            select: {
              id: true,
              removedAt: true,
              document: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
        },
      });
      return res.status(200).json(folders);
    } catch (error) {
      console.error("Request error", error);
      return res.status(500).json({ error: "Error fetching folders" });
    }
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
