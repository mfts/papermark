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
  if (req.method === "PUT") {
    // DELETE /api/teams/:teamId/change-role
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId } = req.query as { teamId: string };
    const userId = (session.user as CustomUser).id;

    const { userToBeChanged, role } = req.body as {
      userToBeChanged: string;
      role: "MEMBER" | "MANAGER" | "ADMIN";
    };

    try {
      const userTeam = await prisma.userTeam.findFirst({
        where: {
          teamId,
          userId,
        },
      });

      if (!userTeam) {
        return res.status(401).json("Unauthorized");
      }

      // Only ADMINs can change roles
      if (role === "ADMIN" && userTeam.role !== "ADMIN") {
        return res.status(403).json("Only admins can change user roles");
      }

      if (userTeam?.role === "ADMIN" && userTeam.userId === userToBeChanged) {
        return res.status(401).json("You can't change the Admin");
      }

      await prisma.userTeam.update({
        where: {
          userId_teamId: {
            userId: userToBeChanged,
            teamId,
          },
        },
        data: {
          role,
        },
      });
      return res.status(204).end();
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
