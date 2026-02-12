import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import slugify from "@sindresorhus/slugify";
import { getServerSession } from "next-auth/next";

import {
  ALLOWED_FOLDER_COLORS,
  ALLOWED_FOLDER_ICONS,
} from "@/lib/constants/folder-constants";
import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "PUT") {
    // PUT /api/teams/:teamId/folders/manage
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }
    const userId = (session.user as CustomUser).id;
    const { teamId } = req.query as { teamId: string };
    const { folderId, name, icon, color } = req.body as {
      folderId: string;
      name: string;
      icon?: string | null;
      color?: string | null;
    };

    try {
      // Validate icon if provided
      if (icon !== undefined && icon !== null && !ALLOWED_FOLDER_ICONS.includes(icon as any)) {
        return res.status(400).json({ message: "Invalid folder icon" });
      }

      // Validate color if provided
      if (color !== undefined && color !== null && !ALLOWED_FOLDER_COLORS.includes(color as any)) {
        return res.status(400).json({ message: "Invalid folder color" });
      }

      // Validate name
      if (!name || name.trim().length === 0) {
        return res.status(400).json({ message: "Folder name is required" });
      }

      if (name.trim().length > 256) {
        return res.status(400).json({ message: "Folder name must be 256 characters or less" });
      }

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
          id: folderId,
        },
        select: {
          name: true,
          path: true,
          icon: true,
          color: true,
        },
      });

      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }

      // take the old path and replace the last part with the new name
      const newPath = folder.path.split("/");
      newPath.pop();
      newPath.push(slugify(name.trim()));

      // Build update data object with only changed fields
      const updateData: {
        name: string;
        path: string;
        icon?: string | null;
        color?: string | null;
      } = {
        name: name.trim(),
        path: newPath.join("/"),
      };

      // Only include icon and color in update if they were provided
      if (icon !== undefined) {
        updateData.icon = icon;
      }
      if (color !== undefined) {
        updateData.color = color;
      }

      const updatedFolder = await prisma.folder.update({
        where: {
          id: folderId,
        },
        data: updateData,
      });

      // Get parent folder path for cache invalidation
      const parentFolderPath = folder.path.substring(
        0,
        folder.path.lastIndexOf("/"),
      );

      return res.status(200).json({
        message: "Folder updated successfully",
        parentFolderPath: parentFolderPath || "/",
        folder: updatedFolder,
      });
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow PUT requests
    res.setHeader("Allow", ["PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
