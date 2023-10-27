import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { errorHanlder } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
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

      if (userTeam?.role === "ADMIN") {
        return res.status(401).json("You can't remove the Admin");
      }

      await prisma.userTeam.delete({
        where: {
          userId_teamId: {
            userId: userToBeDeleted,
            teamId,
          },
        },
      });
      return res.status(204);
    } catch (error) {
      errorHanlder(error, res);
    }
  } else {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
