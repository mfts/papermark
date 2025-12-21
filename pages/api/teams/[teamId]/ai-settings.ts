import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { errorhandler } from "@/lib/errorHandler";
import { getFeatureFlags } from "@/lib/featureFlags";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

const updateAISettingsSchema = z.object({
  agentsEnabled: z.boolean(),
});

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const userId = (session.user as CustomUser).id;
  const { teamId } = req.query as { teamId: string };

  // Verify user has access to the team
  const teamAccess = await prisma.userTeam.findUnique({
    where: {
      userId_teamId: {
        userId: userId,
        teamId: teamId,
      },
    },
    select: { teamId: true, role: true },
  });

  if (!teamAccess) {
    return res.status(401).end("Unauthorized");
  }

  // Check if AI feature is enabled for this team
  const features = await getFeatureFlags({ teamId });

  if (req.method === "GET") {
    // GET /api/teams/:teamId/ai-settings
    try {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: {
          agentsEnabled: true,
          vectorStoreId: true,
        },
      });

      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      const isAdmin = teamAccess.role === "ADMIN";

      return res.status(200).json({
        agentsEnabled: team.agentsEnabled,
        vectorStoreId: team.vectorStoreId,
        isAdmin,
        isAIFeatureEnabled: features.ai,
      });
    } catch (error) {
      errorhandler(error, res);
    }
  } else if (req.method === "PATCH") {
    // PATCH /api/teams/:teamId/ai-settings
    // AI feature must be enabled for this team
    if (!features.ai) {
      return res
        .status(403)
        .json({ error: "AI feature is not available for this team" });
    }

    // Only admins can update AI settings
    if (teamAccess.role !== "ADMIN") {
      return res.status(403).json({
        error: "Only team admins can manage AI settings",
      });
    }

    try {
      const validation = updateAISettingsSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid request body",
          details: validation.error,
        });
      }

      const { agentsEnabled } = validation.data;

      const updatedTeam = await prisma.team.update({
        where: { id: teamId },
        data: { agentsEnabled },
        select: {
          agentsEnabled: true,
          vectorStoreId: true,
        },
      });

      return res.status(200).json({
        agentsEnabled: updatedTeam.agentsEnabled,
        vectorStoreId: updatedTeam.vectorStoreId,
      });
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["GET", "PATCH"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
