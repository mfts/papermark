import { NextApiRequest, NextApiResponse } from "next";

import { Session } from "next-auth";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../../auth/[...nextauth]";

interface CustomSession extends Session {
  user: {
    id: string;
    name?: string | null;
  };
}

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "PATCH") {
    // PATCH /api/teams/:teamId/update-advanced-mode
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId } = req.query as { teamId: string };
    const { enableExcelAdvancedMode } = req.body;

    try {
      // Verify user is part of the team
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId: (session.user as CustomUser).id,
            },
          },
        },
      });

      if (!team) {
        return res.status(404).json({ error: "Team not found." });
      }

      const isPlanRestricted = ["free", "starter", "pro"].includes(team.plan);
      const isTrial = team.plan.includes("trial");

      if (isPlanRestricted && !isTrial) {
        return res
          .status(403)
          .json({ error: "Your current plan does not allow this feature." });
      }

      // Update team limits
      await prisma.team.update({
        where: {
          id: teamId,
        },
        data: {
          enableExcelAdvancedMode,
        },
      });

      return res.status(200).json("Excel mode updated!");
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow PATCH requests
    res.setHeader("Allow", "[PATCH]");
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
