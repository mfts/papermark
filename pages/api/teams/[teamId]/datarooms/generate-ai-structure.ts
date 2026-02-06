import type { NextApiRequest, NextApiResponse } from "next";

import { isTeamPausedById } from "@/ee/features/billing/cancellation/lib/is-team-paused";
import {
  getDataroomSystemPrompt,
  getDataroomUserPrompt,
} from "@/ee/features/templates/lib/prompts";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../../../auth/[...nextauth]";

export const config = {
  maxDuration: 120,
};

// Non-recursive folder schema with fixed depth (max 3 levels)
// This avoids the "Recursive reference detected" error from the AI SDK
// which cannot convert z.lazy() recursive schemas to JSON Schema properly
// Reduced from 5 levels to 3 levels to keep the structure manageable

// Level 3 (deepest level) - no subfolders allowed
const folderLevel3Schema = z.object({
  name: z.string().min(1).max(100),
});

// Level 2 - limited subfolders
const folderLevel2Schema = z.object({
  name: z.string().min(1).max(100),
  subfolders: z.array(folderLevel3Schema).max(4).optional(),
});

// Level 1 (top-level folders) - limited subfolders
const folderLevel1Schema = z.object({
  name: z.string().min(1).max(100),
  subfolders: z.array(folderLevel2Schema).max(5).optional(),
});

const dataroomStructureSchema = z.object({
  name: z.string().min(1).max(255),
  folders: z.array(folderLevel1Schema).min(1).max(10),
});

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // POST /api/teams/:teamId/datarooms/generate-ai-structure
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const userId = (session.user as CustomUser).id;
    const { teamId } = req.query as { teamId: string };
    const { description } = req.body as { description: string };

    if (
      !description ||
      typeof description !== "string" ||
      description.trim().length === 0
    ) {
      return res.status(400).json({
        message: "Description is required",
      });
    }

    // Validate description length and content
    if (description.length > 2000) {
      return res.status(400).json({
        message:
          "Description is too long. Please keep it under 2000 characters.",
      });
    }

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

      // Check if team is paused
      const teamIsPaused = await isTeamPausedById(teamId);
      if (teamIsPaused) {
        return res.status(403).json({
          error:
            "Team is currently paused. New dataroom creation is not available.",
        });
      }

      // Use AI SDK with structured outputs to generate folder structure
      // This automatically validates the response format and reduces parsing errors
      const [systemPrompt, userPrompt] = await Promise.all([
        getDataroomSystemPrompt(),
        getDataroomUserPrompt(description),
      ]);

      const result = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: dataroomStructureSchema,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        providerOptions: {
          openai: {
            maxOutputTokens: 600,
          },
        },
      });

      // Validate folder depth (max 3 levels) and count
      const validateFolderStructure = (folder: any, depth = 0): boolean => {
        if (depth >= 3) return false;
        if (folder.subfolders) {
          // Enforce subfolder limits
          if (depth === 0 && folder.subfolders.length > 5) return false;
          if (depth === 1 && folder.subfolders.length > 4) return false;
          return folder.subfolders.every((sub: any) =>
            validateFolderStructure(sub, depth + 1),
          );
        }
        return true;
      };

      if (
        !result.object.folders.every((folder) => validateFolderStructure(folder))
      ) {
        return res.status(500).json({
          message:
            "Generated folder structure exceeds maximum depth (3 levels)",
        });
      }

      // Additional safety: ensure we don't have too many top-level folders
      if (result.object.folders.length > 10) {
        return res.status(500).json({
          message:
            "Generated folder structure has too many top-level folders (max 10)",
        });
      }

      res.status(200).json({
        name: result.object.name.trim(),
        folders: result.object.folders,
        message: "Folder structure generated successfully",
      });
    } catch (error) {
      const errorMessage =
        process.env.NODE_ENV === "production"
          ? "An unexpected error occurred"
          : (error as Error).message;

      return res.status(500).json({
        message: "Error generating folder structure",
        error: errorMessage,
      });
    }
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
