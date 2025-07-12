import { NextApiResponse } from "next";

import slugify from "@sindresorhus/slugify";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createTeamHandler({
  PUT: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId } = req.query as { teamId: string };
    const { folderId, name } = req.body as { folderId: string; name: string };

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId: req.user.id,
            },
          },
        },
      });

      if (!team) {
        res.status(401).end("Unauthorized");
        return;
      }

      const folder = await prisma.folder.findUnique({
        where: {
          id: folderId,
        },
        select: {
          name: true,
          path: true,
        },
      });

      if (!folder) {
        res.status(404).json({ message: "Folder not found" });
        return;
      }

      // take the old path and replace the last part with the new name
      const newPath = folder.path.split("/");
      newPath.pop();
      newPath.push(slugify(name));

      await prisma.folder.update({
        where: {
          id: folderId,
        },
        data: {
          name: name,
          path: newPath.join("/"),
        },
      });

      res.status(200).json({ message: "Folder name updated successfully" });
    } catch (error) {
      errorhandler(error, res);
    }
  },
});
