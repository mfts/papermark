import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "DELETE") {
    // DELETE /api/teams/:teamId/links/:id
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, id: linkId } = req.query as { teamId: string; id: string };
    const userId = (session.user as CustomUser).id;

    try {
      // First verify user has access to the team and check plan
      const teamAccess = await prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId: userId,
            teamId: teamId,
          },
          role: {
            in: ["ADMIN", "MANAGER"],
          },
          status: "ACTIVE",
        },
        select: {
          teamId: true,
          role: true,
          team: {
            select: {
              plan: true,
            },
          },
        },
      });

      if (!teamAccess) {
        return res.status(401).end("Unauthorized");
      }

      // Check if team is on free plan
      if (teamAccess.team.plan === "free") {
        return res.status(403).json({
          error:
            "Link deletion is not available on the free plan. Please upgrade to delete links.",
        });
      }

      // Find the link and verify it belongs to this team
      const linkToDelete = await prisma.link.findUnique({
        where: {
          id: linkId,
          teamId: teamId,
          deletedAt: null, // Only allow deleting links that aren't already deleted
        },
        select: {
          id: true,
        },
      });

      if (!linkToDelete) {
        return res.status(404).json({ error: "Link not found" });
      }

      // Soft delete the link by setting deletedAt and isArchived
      await prisma.link.update({
        where: {
          id: linkId,
        },
        data: {
          deletedAt: new Date(),
          isArchived: true,
        },
      });

      log({
        message: `Link deleted: ${linkId} by user ${userId} in team ${teamId}.`,
        type: "info",
      });

      return res.status(204).end(); // 204 No Content response for successful deletes
    } catch (error) {
      log({
        message: `Failed to delete link: ${linkId} in team ${teamId}. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, userId: ${userId}}\``,
        type: "error",
      });
      errorhandler(error, res);
    }
  } else {
    // We only allow DELETE requests for now
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
