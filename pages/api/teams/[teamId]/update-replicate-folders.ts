import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "PATCH") {
    // PATCH /api/teams/:teamId/update-replicate-folders
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const userId = (session.user as CustomUser).id;
    const { teamId } = req.query as { teamId: string };
    const { replicateDataroomFolders } = req.body as {
      replicateDataroomFolders: boolean;
    };

    try {
      const teamAccess = await prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId: userId,
            teamId: teamId,
          },
        },
      });

      if (!teamAccess) {
        return res.status(401).end("Unauthorized");
      }

      // Update the team's replicateDataroomFolders setting
      const updatedTeam = await prisma.team.update({
        where: { id: teamId },
        data: {
          replicateDataroomFolders,
        },
        select: {
          id: true,
          name: true,
          replicateDataroomFolders: true,
        },
      });

      return res.status(200).json(updatedTeam);
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow PATCH requests
    res.setHeader("Allow", ["PATCH"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
