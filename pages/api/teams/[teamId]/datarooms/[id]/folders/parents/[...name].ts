import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { folderPathSchema } from "@/lib/zod/schemas/folders";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/datarooms/:id/folders/parents/:name
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

    // Validate that name is an array of strings using shared Zod schema
    const nameValidation = folderPathSchema.safeParse(name);
    if (!nameValidation.success) {
      return res.status(400).json({
        error: "Invalid folder path format",
        details: nameValidation.error.issues.map((issue) => issue.message),
      });
    }

    const validatedName = nameValidation.data;
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

      for (let i = 0; i < validatedName.length; i++) {
        const path = "/" + validatedName.slice(0, i + 1).join("/"); // construct the materialized path
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
            hierarchicalIndex: true,
          },
        });

        if (!folder) {
          return res.status(404).end("Parent Folder not found");
        }

        folderNames.push({
          name: folder.name,
          path: path,
          hierarchicalIndex: folder.hierarchicalIndex,
        });
      }

      return res.status(200).json(folderNames);
    } catch (error) {
      console.error("Request error", error);
      return res.status(500).json({ error: "Error fetching folders" });
    }
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
