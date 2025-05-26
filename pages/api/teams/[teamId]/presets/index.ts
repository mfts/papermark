import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";

import { errorhandler } from "@/lib/errorHandler";
import { newId } from "@/lib/id-helper";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { presetDataSchema } from "@/lib/zod/schemas/presets";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb",
    },
  },
};

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
    errorhandler(error, res);
  }

  if (req.method === "GET") {
    // GET /api/teams/:teamId/presets
    try {
      const presets = await prisma.linkPreset.findMany({
        where: {
          teamId: teamId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.status(200).json(presets);
    } catch (error) {
      errorhandler(error, res);
    }
  } else if (req.method === "POST") {
    // POST /api/teams/:teamId/presets
    try {
      // Validate request body with Zod schema
      const validatedData = presetDataSchema.parse(req.body);

      // Create a new preset
      const preset = await prisma.linkPreset.create({
        data: {
          ...validatedData,
          teamId,
          pId: newId("preset"),
          watermarkConfig: validatedData.watermarkConfig
            ? JSON.stringify(validatedData.watermarkConfig)
            : Prisma.JsonNull,
          customFields: validatedData.customFields
            ? validatedData.customFields
            : Prisma.JsonNull,
        },
      });
      return res
        .status(201)
        .json({ message: "Preset created successfully", preset });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Invalid preset data",
          errors: error.errors,
        });
      }
      errorhandler(error, res);
    }
  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
