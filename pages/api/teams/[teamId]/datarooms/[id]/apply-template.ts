import type { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import slugify from "@sindresorhus/slugify";
import { getServerSession } from "next-auth/next";

import {
  DATAROOM_TEMPLATES,
  FolderTemplate,
} from "@/lib/constants/dataroom-templates";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const userId = (session.user as CustomUser).id;
    const { teamId, id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };
    const { type } = req.body as { type: string };

    // Validate the type
    if (!type || !DATAROOM_TEMPLATES[type]) {
      return res.status(400).json({
        message: "Invalid template type.",
      });
    }

    try {
      // Check if the user is part of the team and has access to the dataroom
      const dataroom = await prisma.dataroom.findUnique({
        where: {
          id: dataroomId,
          teamId: teamId,
          team: {
            users: {
              some: {
                userId: userId,
              },
            },
          },
        },
      });

      if (!dataroom) {
        return res.status(401).end("Unauthorized");
      }

      const template = DATAROOM_TEMPLATES[type];

      // Helper function to create folders recursively
      const createFolders = async (
        folders: FolderTemplate[],
        parentPath: string = "",
        parentId: string | null = null,
      ): Promise<void> => {
        for (const folder of folders) {
          const folderPath = parentPath + "/" + slugify(folder.name);

          // Create the folder
          const createdFolder = await prisma.dataroomFolder.create({
            data: {
              name: folder.name,
              path: folderPath,
              parentId: parentId,
              dataroomId: dataroom.id,
            },
          });

          // If the folder has subfolders, create them recursively
          if (folder.subfolders && folder.subfolders.length > 0) {
            await createFolders(
              folder.subfolders,
              folderPath,
              createdFolder.id,
            );
          }
        }
      };

      await createFolders(template.folders);

      res.status(200).json({
        message: "Template applied successfully",
      });
    } catch (error) {
      console.error("Error applying template:", error);
      return res.status(500).json({ error: "Error applying template" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
