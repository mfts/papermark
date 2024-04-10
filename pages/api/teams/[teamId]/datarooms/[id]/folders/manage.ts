import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { errorhandler } from "@/lib/errorHandler";
import slugify from "@sindresorhus/slugify";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "PUT") {
    // PUT /api/teams/:teamId/datarooms/:id/folders/manage
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

      console.log("Folder old path", folder.path);

      // take the old path and replace the last part with the new name
      const newPath = folder.path.split("/");
      newPath.pop();
      newPath.push(slugify(name));

      console.log("Folder new path", newPath.join("/"));

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
  } else if (req.method === "DELETE") {
    // DELETE /api/teams/:teamId/folders/manage
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const { teamId } = req.query as { teamId: string };
    const { folderId } = req.body as { folderId: string };

    const userId = (session.user as CustomUser).id;

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

      const documents = await prisma.document.findMany({
        where: {
          folderId: folderId,
          teamId: teamId,
        },
        select: {
          id: true,
        },
      });

      if (documents.length > 0) {
        return res
          .status(400)
          .json({ message: "Folder contains documents. Move them first" });
      }

      await prisma.folder.delete({
        where: {
          id: folderId,
        },
      });

      return res.status(204).end(); // 204 No Content response for successful deletes
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow GET, PUT and DELETE requests
    res.setHeader("Allow", ["PUT", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
