import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";

const updateAnnotationSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters")
    .optional(),
  content: z.record(z.any()).optional(), // Rich text content as JSON
  pages: z
    .array(z.number().min(1))
    .min(1, "At least one page must be selected")
    .optional(),
  isVisible: z.boolean().optional(),
});

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const {
    teamId,
    id: docId,
    annotationId,
  } = req.query as {
    teamId: string;
    id: string;
    annotationId: string;
  };

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const userId = (session.user as CustomUser).id;

  try {
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

    // Verify user has access to document
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

    // Verify annotation exists and belongs to document
    const annotation = await prisma.documentAnnotation.findFirst({
      where: {
        id: annotationId,
        documentId: docId,
        teamId,
      },
    });

    if (!annotation) {
      return res.status(404).json({ error: "Annotation not found" });
    }

    if (req.method === "GET") {
      // GET /api/teams/:teamId/documents/:id/annotations/:annotationId
      const fullAnnotation = await prisma.documentAnnotation.findUnique({
        where: { id: annotationId, documentId: docId, teamId },
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

      return res.status(200).json(fullAnnotation);
    } else if (req.method === "PUT") {
      // PUT /api/teams/:teamId/documents/:id/annotations/:annotationId
      const validatedData = updateAnnotationSchema.parse(req.body);

      const updatedAnnotation = await prisma.documentAnnotation.update({
        where: { id: annotationId, documentId: docId, teamId },
        data: validatedData,
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

      return res.status(200).json(updatedAnnotation);
    } else if (req.method === "DELETE") {
      // DELETE /api/teams/:teamId/documents/:id/annotations/:annotationId
      await prisma.documentAnnotation.delete({
        where: { id: annotationId, documentId: docId, teamId },
      });

      return res.status(204).end();
    } else {
      res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid input",
        details: error.errors,
      });
    }

    log({
      message: `Failed to handle annotation ${req.method} for document: _${docId}_ and annotation: _${annotationId}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, userId: ${userId}}\``,
      type: "error",
    });
    errorhandler(error, res);
  }
}
