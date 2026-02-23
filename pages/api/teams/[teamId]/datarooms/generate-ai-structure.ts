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

// Non-recursive folder schema with fixed depth (max 2 levels)
// This avoids the "Recursive reference detected" error from the AI SDK
// which cannot convert z.lazy() recursive schemas to JSON Schema properly
// Limited to top-level folders + 1 level of subfolders for simplicity

// Level 2 (subfolders) - no further nesting allowed
const subfolderSchema = z.object({
  name: z.string().min(1).max(100),
});

// Level 1 (top-level folders) - subfolders is required but can be empty array
const folderSchema = z.object({
  name: z.string().min(1).max(100),
  subfolders: z.array(subfolderSchema).max(5), // Required, but can be empty []
});

const dataroomStructureSchema = z.object({
  name: z.string().min(1).max(255),
  folders: z.array(folderSchema).min(1).max(8),
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

      // Validate folder depth (max 2 levels: top-level + 1 subfolder level)
      const validateFolderStructure = (folder: any): boolean => {
        if (folder.subfolders) {
          // Enforce subfolder limits (max 5 subfolders per folder)
          if (folder.subfolders.length > 5) return false;
          // Ensure subfolders don't have their own subfolders (max 2 levels)
          for (const sub of folder.subfolders) {
            if (sub.subfolders && sub.subfolders.length > 0) return false;
          }
        }
        return true;
      };

      if (
        !result.object.folders.every((folder) => validateFolderStructure(folder))
      ) {
        return res.status(500).json({
          message:
            "Generated folder structure exceeds maximum depth (2 levels)",
        });
      }

      // Additional safety: ensure we don't have too many top-level folders
      if (result.object.folders.length > 8) {
        return res.status(500).json({
          message:
            "Generated folder structure has too many top-level folders (max 8)",
        });
      }

      res.status(200).json({
        name: result.object.name.trim(),
        folders: result.object.folders,
        message: "Folder structure generated successfully",
      });
    } catch (error) {
      console.error("Error generating AI folder structure:", error);

      // Provide more specific error messages based on error type
      let errorMessage = "Error generating folder structure";
      let statusCode = 500;

      if (error instanceof Error) {
        // Check for OpenAI API errors
        if (
          error.message.includes("API key") ||
          error.message.includes("authentication")
        ) {
          errorMessage = "AI service configuration error";
        } else if (
          error.message.includes("rate limit") ||
          error.message.includes("quota")
        ) {
          errorMessage =
            "AI service is temporarily unavailable. Please try again later.";
          statusCode = 429;
        } else if (error.message.includes("timeout")) {
          errorMessage =
            "Request timed out. Please try again with a shorter description.";
          statusCode = 504;
        } else if (process.env.NODE_ENV !== "production") {
          // Only show detailed error in development
          errorMessage = error.message;
        }
      }

      return res.status(statusCode).json({
        message: errorMessage,
      });
    }
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
