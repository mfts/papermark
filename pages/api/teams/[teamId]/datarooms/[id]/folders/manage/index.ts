import { NextApiResponse } from "next";

import slugify from "@sindresorhus/slugify";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default createTeamHandler({
  PUT: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // PUT /api/teams/:teamId/datarooms/:id/folders/manage
    const { id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };
    const { folderId, name } = req.body as { folderId: string; name: string };

    try {
      const folder = await prisma.dataroomFolder.findUnique({
        where: {
          id: folderId,
          dataroomId: dataroomId,
        },
        select: {
          name: true,
          path: true,
        },
      });

      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }

      // take the old path and replace the last part with the new name
      const newPath = folder.path.split("/");
      newPath.pop();
      newPath.push(slugify(name));

      await prisma.dataroomFolder.update({
        where: {
          id: folderId,
        },
        data: {
          name: name,
          path: newPath.join("/"),
        },
      });

      return res
        .status(200)
        .json({ message: "Folder name updated successfully" });
    } catch (error) {
      errorhandler(error, res);
    }
  },
});
