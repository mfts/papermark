import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { isUserMemberOfTeam } from "@/lib/team/helper";
import { errorHandler } from "@/lib/errorHandler";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/datarooms
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }
    const userId = (session?.user as CustomUser).id;
    const teamId = req.query.teamId as string;
    //For fetching datarooms for /datarooms page
    try {
      //Check if user if member of team
      await isUserMemberOfTeam({ teamId, userId });
      const datarooms = await prisma.dataroom.findMany({
        where: {
          teamId,
        },
        include: {
          folders: {
            where: {
              parentFolderId: null,
            },
          },
          _count: {
            select: {
              files: true,
            },
          },
        },
      });

      res.status(200).json({ datarooms });
    } catch (error) {
      errorHandler(error, res);
    }
  } else if (req.method === "DELETE") {
    // DELETE /api/datarooms
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }
    const { teamId, id } = req.body as { teamId: string; id: string };
    const userId = (session?.user as CustomUser).id;

    try {
      const dataroom = await prisma.dataroom.findUnique({
        where: {
          id: id,
        },
      });

      //Check if user is admin of the team
      if (dataroom?.ownerId !== userId) {
        return res.status(403).end("Deleting datarooms is restricted to administrators only")
      }

      if (!dataroom) {
        return res.status(404).end("Dataroom not found");
      }

      // delete the dataroom from database
      await prisma.dataroom.delete({
        where: {
          id: id,
        },
      });

      res.status(204).end(); // 204 No Content response for successful deletes
    } catch (error) {
      errorHandler(error, res);
    }
  } else {
    // We only allow GET and DELETE requests
    res.setHeader("Allow", ["GET", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
