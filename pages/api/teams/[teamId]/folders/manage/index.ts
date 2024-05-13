import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import slugify from "@sindresorhus/slugify";
import { getServerSession } from "next-auth/next";

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
    const { folderId, name } = req.body as { folderId: string; name: string };

    try {
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
        },
      });

      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
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

      return res
        .status(200)
        .json({ message: "Folder name updated successfully" });
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow PUT requests
    res.setHeader("Allow", ["PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
