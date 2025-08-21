import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth";
import { z } from "zod";

import { getFileForDocumentPage } from "@/lib/documents/get-file-helper";

import { authOptions } from "../auth/[...nextauth]";

// Zod schema for input validation
const getThumbnailSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
  pageNumber: z.string().transform((val, ctx) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Page number must be a positive integer",
      });
      return z.NEVER;
    }
    return parsed;
  }),
  versionNumber: z
    .string()
    .optional()
    .transform((val, ctx) => {
      if (!val || val === "undefined") return undefined;
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Version number must be a positive integer",
        });
        return z.NEVER;
      }
      return parsed;
    }),
});

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // We only allow GET requests
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  // Validate input parameters
  const validationResult = getThumbnailSchema.safeParse(req.query);
  if (!validationResult.success) {
    return res.status(400).json({
      message: "Invalid parameters",
      errors: validationResult.error.issues,
    });
  }

  const { documentId, pageNumber, versionNumber } = validationResult.data;

  try {
    const imageUrl = await getFileForDocumentPage(
      pageNumber,
      documentId,
      versionNumber,
    );

    return res.status(200).json({ imageUrl });
  } catch (error) {
    console.error("Error in get-thumbnail:", {
      documentId,
      pageNumber,
      versionNumber,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    // Return more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return res.status(404).json({
          message:
            "Thumbnail not available yet. Document may still be processing.",
          code: "THUMBNAIL_NOT_FOUND",
        });
      }
    }

    return res.status(500).json({
      message: "Failed to generate thumbnail",
      code: "THUMBNAIL_ERROR",
    });
  }
}
