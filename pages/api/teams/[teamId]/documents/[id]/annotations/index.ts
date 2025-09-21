import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";

const createAnnotationSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  content: z.record(z.any()).nullable().optional(), // Rich text content as JSON - allow null/omitted
  pages: z
    .array(z.number().int().min(1))
    .min(1, "At least one page must be selected"),
  isVisible: z.boolean().default(true),
});

const updateAnnotationSchema = createAnnotationSchema.partial();

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/documents/:id/annotations
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, id: docId } = req.query as { teamId: string; id: string };
    const userId = (session.user as CustomUser).id;

    try {
      // Validate access; avoid heavy includes
      const teamAccess = await prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
      });

      if (!teamAccess) {
        return res.status(401).end("Unauthorized");
      }
      const document = await prisma.document.findUnique({
        where: {
          id: docId,
          teamId,
        },
        select: { id: true },
      });

      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      const annotations = await prisma.documentAnnotation.findMany({
        where: { documentId: docId, teamId },
        include: {
          images: true,
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return res.status(200).json(annotations);
    } catch (error) {
      log({
        message: `Failed to get annotations for document: _${docId}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, userId: ${userId}}\``,
        type: "error",
      });
      errorhandler(error, res);
    }
  } else if (req.method === "POST") {
    // POST /api/teams/:teamId/documents/:id/annotations
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, id: docId } = req.query as { teamId: string; id: string };
    const userId = (session.user as CustomUser).id;

    try {
      const validatedData = createAnnotationSchema.parse(req.body);

      const teamAccess = await prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
      });

      if (!teamAccess) {
        return res.status(401).end("Unauthorized");
      }

      const document = await prisma.document.findUnique({
        where: {
          id: docId,
          teamId,
        },
        select: { id: true },
      });

      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      const annotation = await prisma.documentAnnotation.create({
        data: {
          ...validatedData,
          content: validatedData.content ?? Prisma.JsonNull, // Convert undefined to Prisma.JsonNull
          documentId: docId,
          teamId,
          createdById: userId,
        },
        include: {
          images: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return res.status(201).json(annotation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input",
          details: error.errors,
        });
      }

      log({
        message: `Failed to create annotation for document: _${docId}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, userId: ${userId}}\``,
        type: "error",
      });
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
