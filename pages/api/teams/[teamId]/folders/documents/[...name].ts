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
    // GET /api/teams/:teamId/folders/documents/:name
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const userId = (session.user as CustomUser).id;
    const { teamId, name } = req.query as { teamId: string; name: string[] };

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
        },
      });

      if (!folder) {
        return res.status(404).end("Folder not found");
      }

      const documents = await prisma.document.findMany({
        where: {
          teamId: teamId,
          folderId: folder.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          _count: {
            select: { links: true, views: true, versions: true },
          },
          links: {
            take: 1,
            select: { id: true },
          },
        },
      });

      return res.status(200).json(documents);
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
