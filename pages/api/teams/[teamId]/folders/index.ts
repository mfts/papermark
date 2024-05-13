import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import slugify from "@sindresorhus/slugify";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/folders
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const userId = (session.user as CustomUser).id;
    const { teamId, root } = req.query as { teamId: string; root?: string };

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

      /** if root is present then only get root folders */
      if (root === "true") {
        const folders = await prisma.folder.findMany({
          where: {
            teamId: teamId,
            parentId: null,
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

        return res.status(200).json(folders);
      }

      const folders = await prisma.folder.findMany({
        where: {
          teamId: teamId,
        },
        orderBy: {
          name: "asc",
        },
        include: {
          documents: {
            select: {
              id: true,
              name: true,
              folderId: true,
            },
          },
          childFolders: {
            include: {
              documents: {
                select: {
                  id: true,
                  name: true,
                  folderId: true,
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
  } else if (req.method === "POST") {
    // POST /api/teams/:teamId/folders
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const userId = (session.user as CustomUser).id;

    const { teamId } = req.query as { teamId: string };
    const { name, path } = req.body as { name: string; path: string };

    const childFolderPath = path
      ? "/" + path + "/" + slugify(name)
      : "/" + slugify(name);

    const parentFolderPath = path ? "/" + path : "/";

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

      const parentFolder = await prisma.folder.findUnique({
        where: {
          teamId_path: {
            teamId: teamId,
            path: parentFolderPath,
          },
        },
        select: {
          id: true,
          name: true,
          path: true,
        },
      });

      const folder = await prisma.folder.create({
        data: {
          name: name,
          path: childFolderPath,
          parentId: parentFolder?.id ?? null,
          teamId: teamId,
        },
      });

      const folderWithDocs = {
        ...folder,
        documents: [],
        childFolders: [],
        parentFolderPath: parentFolderPath,
      };

      res.status(201).json(folderWithDocs);
    } catch (error) {
      console.error("Request error", error);
      res.status(500).json({ error: "Error creating folder" });
    }
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
