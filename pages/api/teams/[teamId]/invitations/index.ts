import { getServerSession } from "next-auth";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { errorhandler } from "@/lib/errorHandler";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/invitations
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauhorized");
    }

    const { teamId } = req.query as { teamId: string };

    try {
      // check if currentUser is part of the team with the teamId
      const userTeam = await prisma.userTeam.findFirst({
        where: {
          teamId,
          userId: (session.user as CustomUser).id,
        },
      });

      if (!userTeam) {
        return res.status(403).json("You are not part of this team");
      }

      // get current invitations for the team
      const invitations = await prisma.invitation.findMany({
        where: {
          teamId: teamId,
        },
        select: {
          email: true,
          expires: true,
        },
      });

      if (!invitations) {
        return res.status(404).json("No invitations found for this team");
      }

      res.status(200).json(invitations);
      return;
    } catch (error) {
      errorhandler(error, res);
    }
  } else if (req.method === "DELETE") {
    // DELETE /api/teams/:teamId/invitations
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauhorized");
    }

    const { teamId } = req.query as { teamId: string };

    const { email } = req.body as { email: string };

    try {
      // check if currentUser is part of the team with the teamId
      const userTeam = await prisma.userTeam.findFirst({
        where: {
          teamId,
          userId: (session.user as CustomUser).id,
        },
      });

      if (!userTeam) {
        return res.status(403).json("You are not part of this team");
      }

      // delete invitation
      await prisma.invitation.delete({
        where: {
          email_teamId: {
            teamId: teamId,
            email: email,
          },
        },
      });

      res.status(204).end();
      return;
    } catch (error) {
      errorhandler(error, res);
    }
  }
}
