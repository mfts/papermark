import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import {
  CustomUser,
} from "@/lib/types";

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
    const { query, sort } = req.query as { query?: string; sort?: string };

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

      let orderBy: Prisma.DocumentOrderByWithRelationInput;

      if (sort) {
        switch (sort) {
          case "createdAt":
            orderBy = { createdAt: "desc" };
            break;
          case "views":
            orderBy = { views: { _count: "desc" } };
            break;
          case "name":
            orderBy = { name: "asc" };
            break;
          case "links":
            orderBy = { links: { _count: "desc" } };
            break;
          default:
            orderBy = { createdAt: "desc" };
        }
      } else {
        orderBy = { createdAt: "desc" };
      }

      const documents = await prisma.document.findMany({
        where: {
          teamId: teamId,
          folderId: folder.id,
          ...(query && {
            name: {
              contains: query,
              mode: "insensitive",
            },
          }),
        },
        orderBy,
        include: {
          ...(sort === "lastViewed" && {
            views: {
              select: { viewedAt: true },
              orderBy: { viewedAt: "desc" },
              take: 1,
            },
          }),
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
          folder: {
            select: {
              name: true,
              path: true,
            },
          },
        },
      });

      let sortedDocuments = documents;

      if (sort === "lastViewed") {
        sortedDocuments = documents.sort((a, b) => {
          const aLastView = a.views?.[0]?.viewedAt;
          const bLastView = b.views?.[0]?.viewedAt;

          if (!aLastView) return 1;
          if (!bLastView) return -1;

          return bLastView.getTime() - aLastView.getTime();
        });
      }

      const documentsWithFolderList = sortedDocuments.map((doc) => {
        const folderList = doc.folder
          ? doc.folder.path.split("/").filter(Boolean)
          : [];
        return {
          ...doc,
          folderList,
        };
      });

      return res.status(200).json(documentsWithFolderList);
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
