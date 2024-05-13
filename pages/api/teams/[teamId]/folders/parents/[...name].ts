import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/folders/parents/:name
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const userId = (session.user as CustomUser).id;
    const { teamId, name } = req.query as { teamId: string; name: string[] };

    let folderNames = [];

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
          return res.status(404).end("Parent Folder not found");
        }

        folderNames.push({ name: folder.name, path: path });
      }

      return res.status(200).json(folderNames);
    } catch (error) {
      console.error("Request error", error);
      return res.status(500).json({ error: "Error fetching folders" });
    }
  } else {
    // We only allow GET requests
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
