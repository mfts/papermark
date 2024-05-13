import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";

import { identifyUser, trackAnalytics } from "@/lib/analytics";
import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/invitations/accept
    const session = await getServerSession(req, res, authOptions);

    const { teamId } = req.query as { teamId: string };

    if (!session) {
      res.redirect(`/login?next=/api/teams/${teamId}/invitations/accept`);
      return;
    }

    const userId = (session.user as CustomUser).id;

    try {
      const userTeam = await prisma.userTeam.findFirst({
        where: {
          teamId,
          userId,
        },
      });

      if (userTeam) {
        // User is already in the team
        return res.redirect(`/documents`);
      }

      const invitation = await prisma.invitation.findUnique({
        where: {
          email_teamId: {
            email: (session?.user as CustomUser).email!,
            teamId,
          },
        },
      });

      if (!invitation) {
        return res.status(404).json("Invalid invitation");
      }

      if (invitation.email !== (session?.user as CustomUser).email) {
        return res.status(403).json("You are not invited to this team");
      }

      const currentTime = new Date();
      if (currentTime > invitation.expires) {
        return res.status(410).json("Invitation link has expired");
      }

      await prisma.team.update({
        where: {
          id: teamId,
        },
        data: {
          users: {
            create: {
              userId,
            },
          },
        },
      });

      await identifyUser(invitation.email);
      await trackAnalytics({
        event: "Team Member Invitation Accepted",
        teamId: teamId,
      });

      // delete the invitation record after user is successfully added to the team
      await prisma.invitation.delete({
        where: {
          token: invitation.token,
        },
      });

      return res.redirect(`/documents`);
    } catch (error) {
      errorhandler(error, res);
    }
  }
}
