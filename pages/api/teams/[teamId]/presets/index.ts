import { NextApiResponse } from "next";

import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { errorhandler } from "@/lib/errorHandler";
import { newId } from "@/lib/id-helper";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { presetDataSchema } from "@/lib/zod/schemas/presets";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb",
    },
  },
};

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId } = req.query as { teamId: string };

    try {
      const presets = await prisma.linkPreset.findMany({
        where: {
          teamId: teamId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.status(200).json(presets);
    } catch (error) {
      errorhandler(error, res);
    }
  },

  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId } = req.query as { teamId: string };

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
      res.status(201).json({ message: "Preset created successfully", preset });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: "Invalid preset data",
          errors: error.errors,
        });
        return;
      }
      errorhandler(error, res);
    }
  },
});
