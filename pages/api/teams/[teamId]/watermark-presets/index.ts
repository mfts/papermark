import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser, WatermarkConfigSchema } from "@/lib/types";

export const createWatermarkPresetBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(50, "Name is too long."),
  config: WatermarkConfigSchema,
});

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const { teamId } = req.query as { teamId: string };

  try {
    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
      select: {
        id: true,
        users: { select: { userId: true } },
      },
    });

    // check that the user is member of the team, otherwise return 403
    const teamUsers = team?.users;
    const isUserPartOfTeam = teamUsers?.some(
      (user) => user.userId === (session.user as CustomUser).id,
    );
    if (!isUserPartOfTeam) {
      return res.status(403).end("Unauthorized to access this team");
    }
  } catch (error) {
    return errorhandler(error, res);
  }

  if (req.method === "GET") {
    // GET /api/teams/:teamId/watermark-presets
    try {
      const presets = await prisma.watermarkPreset.findMany({
        where: { teamId },
        orderBy: { name: "asc" },
      });

      return res.status(200).json({ presets });
    } catch (error) {
      return errorhandler(error, res);
    }
  } else if (req.method === "POST") {
    // POST /api/teams/:teamId/watermark-presets
    try {
      const { name, config } = createWatermarkPresetBodySchema.parse(
        req.body,
      );

      const existingPreset = await prisma.watermarkPreset.findFirst({
        where: { teamId, name },
      });
      if (existingPreset) {
        return res.status(400).json({
          error: "A watermark preset with that name already exists.",
        });
      }

      const preset = await prisma.watermarkPreset.create({
        data: {
          name,
          config,
          teamId,
        },
      });

      return res.status(200).json(preset);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2002"
      ) {
        return res.status(400).json({
          error: "A watermark preset with that name already exists.",
        });
      }
      return errorhandler(error, res);
    }
  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
