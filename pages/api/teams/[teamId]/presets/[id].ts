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
    const { teamId, id: presetId } = req.query as {
      teamId: string;
      id: string;
    };

    try {
      const preset = await prisma.linkPreset.findFirst({
        where: {
          id: presetId,
          teamId: teamId,
        },
      });

      if (!preset) {
        res.status(404).json({ message: "Preset not found" });
        return;
      }

      res.status(200).json(preset);
    } catch (error) {
      errorhandler(error, res);
    }
  },

  PUT: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId, id: presetId } = req.query as {
      teamId: string;
      id: string;
    };

    try {
      // Validate request body with Zod schema
      const validatedData = presetDataSchema.parse(req.body);

      // Check if preset exists and belongs to the team
      const existingPreset = await prisma.linkPreset.findUnique({
        where: {
          id: presetId,
          teamId: teamId,
        },
      });

      if (!existingPreset) {
        res.status(404).json({ message: "Preset not found" });
        return;
      }

      // Update the preset
      const updatedPreset = await prisma.linkPreset.update({
        where: {
          id: presetId,
        },
        data: {
          ...validatedData,
          ...(!existingPreset.pId && { pId: newId("preset") }),
          // Convert objects to JSON strings for storage
          watermarkConfig: validatedData.watermarkConfig
            ? JSON.stringify(validatedData.watermarkConfig)
            : Prisma.JsonNull,
          customFields: validatedData.customFields
            ? validatedData.customFields
            : Prisma.JsonNull,
        },
      });

      res.status(200).json({
        message: "Preset updated successfully",
        preset: updatedPreset,
      });
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

  DELETE: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId, id: presetId } = req.query as {
      teamId: string;
      id: string;
    };

    try {
      // Check if preset exists and belongs to the team
      const existingPreset = await prisma.linkPreset.findFirst({
        where: {
          id: presetId,
          teamId: teamId,
        },
      });

      if (!existingPreset) {
        res.status(404).json({ message: "Preset not found" });
        return;
      }

      await prisma.linkPreset.delete({
        where: {
          id: presetId,
        },
      });

      res.status(204).end();
    } catch (error) {
      errorhandler(error, res);
    }
  },
});
