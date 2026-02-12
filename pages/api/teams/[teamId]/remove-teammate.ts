import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "DELETE") {
    // DELETE /api/teams/:teamId/remove-teammate
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId } = req.query as { teamId: string };
    const userId = (session.user as CustomUser).id;

    const { userToBeDeleted } = req.body;

    try {
      const userTeam = await prisma.userTeam.findFirst({
        where: {
          teamId,
        },
      });

      if (!userTeam) {
        return res.status(401).json("The teammate isn't the part of this team");
      }

      if (userTeam?.role === "ADMIN" && userTeam.userId === userToBeDeleted) {
        return res.status(401).json("You can't remove the Admin");
      }

      await Promise.all([
        // update all documents owned by the user to be deleted to be owned by the team
        prisma.document.updateMany({
          where: {
            teamId,
            ownerId: userToBeDeleted,
          },
          data: {
            ownerId: null,
          },
        }),
        // update all links owned by the user to have no owner
        prisma.link.updateMany({
          where: {
            teamId,
            ownerId: userToBeDeleted,
          },
          data: {
            ownerId: null,
          },
        }),
        // delete the user from the team
        prisma.userTeam.delete({
          where: {
            userId_teamId: {
              userId: userToBeDeleted,
              teamId,
            },
          },
        }),
      ]);

      return res.status(204).end();
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
