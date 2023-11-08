import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    // POST /api/teams/:teamId/update-name
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId } = req.query as { teamId: string };

    try {
      // check if the team exists
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
        },
        include: {
          users: true,
        },
      });
      if (!team) {
        return res.status(400).json("Team doesn't exists");
      }

      // check if current user is admin of the team
      const isUserAdmin = team.users.some(
        (user) =>
          user.role === "ADMIN" &&
          user.userId === (session.user as CustomUser).id
      );
      if (!isUserAdmin) {
        return res
          .status(403)
          .json("You are not permitted to perform this action");
      }

      // update name
      await prisma.team.update({
        where: {
          id: teamId,
        },
        data: {
          name: req.body.name,
        },
      });

      return res.status(200).json("Team name updated!");
    } catch (error) {
      return res.status(500).json((error as Error).message);
    }
  } else {
    // We only allow POST requests
    res.setHeader("Allow", "[POST]");
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
