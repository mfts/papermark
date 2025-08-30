import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { validateContent } from "@/lib/utils/sanitize-html";

// Zod validation schemas
const paramSchema = z.object({
  teamId: z.string().cuid("Invalid team ID format"),
  id: z.string().cuid("Invalid dataroom ID format"),
  faqId: z.string().cuid("Invalid FAQ ID format").optional(),
});

const publishFAQSchema = z.object({
  editedQuestion: z
    .string()
    .min(10, "Question must be at least 10 characters")
    .max(1000, "Question too long"),
  originalQuestion: z.string().optional(),
  answer: z
    .string()
    .min(10, "Answer must be at least 10 characters")
    .max(2000, "Answer too long"),
  visibilityMode: z.enum(["PUBLIC_DATAROOM", "PUBLIC_LINK", "PUBLIC_DOCUMENT"]),
  linkId: z.string().cuid("Invalid link ID format").optional(),
  dataroomDocumentId: z.string().cuid("Invalid document ID format").optional(),
  sourceConversationId: z
    .string()
    .cuid("Invalid conversation ID format")
    .optional(),
  questionMessageId: z
    .string()
    .cuid("Invalid question message ID format")
    .optional(),
  answerMessageId: z
    .string()
    .cuid("Invalid answer message ID format")
    .optional(),
  isAnonymized: z.boolean().default(true),
  documentPageNumber: z.number().int().min(1).optional(),
  documentVersionNumber: z.number().int().min(1).optional(),
});

const updateFAQSchema = z.object({
  editedQuestion: z
    .string()
    .min(10, "Question must be at least 10 characters")
    .max(1000, "Question too long")
    .optional(),
  answer: z
    .string()
    .min(10, "Answer must be at least 10 characters")
    .max(2000, "Answer too long")
    .optional(),
  visibilityMode: z
    .enum(["PUBLIC_DATAROOM", "PUBLIC_LINK", "PUBLIC_DOCUMENT"])
    .optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export interface PublishFAQInput {
  editedQuestion: string;
  originalQuestion?: string;
  answer: string;
  linkId?: string;
  dataroomDocumentId?: string;
  sourceConversationId?: string;
  questionMessageId?: string;
  answerMessageId?: string;
  visibilityMode: "PUBLIC_DATAROOM" | "PUBLIC_LINK" | "PUBLIC_DOCUMENT";
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isAnonymized?: boolean;
  documentPageNumber?: number;
  documentVersionNumber?: number;
}

// Route mapping object to handle different paths
const routeHandlers = {
  // POST /api/teams/[teamId]/datarooms/[dataroomId]/faqs
  "POST /": async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      // Validate URL parameters
      const paramValidation = paramSchema.safeParse({
        teamId: req.query.teamId,
        id: req.query.id,
      });

      if (!paramValidation.success) {
        return res.status(400).json({
          error: "Invalid parameters",
          details: paramValidation.error.errors[0]?.message,
        });
      }

      const { teamId, id: dataroomId } = paramValidation.data;

      // Validate request body
      const bodyValidation = publishFAQSchema.safeParse(req.body);

      if (!bodyValidation.success) {
        return res.status(400).json({
          error: "Invalid request data",
          details: bodyValidation.error.errors[0]?.message,
        });
      }

      const data = bodyValidation.data;
      const userId = (session.user as CustomUser).id;

      // Sanitize content for creation
      const createSanitizedQuestion = validateContent(data.editedQuestion);
      const createSanitizedAnswer = validateContent(data.answer);

      // Verify team access to dataroom
      const dataroom = await prisma.dataroom.findUnique({
        where: {
          id: dataroomId,
          team: {
            id: teamId,
            users: { some: { userId } },
          },
        },
        select: {
          id: true,
          teamId: true,
        },
      });

      if (!dataroom) {
        return res.status(404).json({ error: "Dataroom not found" });
      }

      // Validate visibility mode and related fields
      if (data.visibilityMode === "PUBLIC_LINK" && !data.linkId) {
        return res.status(400).json({
          error: "Link ID is required for link visibility",
        });
      }

      if (
        data.visibilityMode === "PUBLIC_DOCUMENT" &&
        !data.dataroomDocumentId
      ) {
        return res.status(400).json({
          error: "Document ID is required for document visibility",
        });
      }

      // Verify link belongs to dataroom if specified
      if (data.linkId) {
        const link = await prisma.link.findFirst({
          where: {
            id: data.linkId,
            dataroomId: dataroomId,
          },
        });

        if (!link) {
          return res.status(400).json({
            error: "Invalid link for this dataroom",
          });
        }
      }

      // Verify document belongs to dataroom if specified
      if (data.dataroomDocumentId) {
        const dataroomDocument = await prisma.dataroomDocument.findFirst({
          where: {
            id: data.dataroomDocumentId,
            dataroomId: dataroomId,
          },
        });

        if (!dataroomDocument) {
          return res.status(400).json({
            error: "Invalid document for this dataroom",
          });
        }
      }

      // Validate that referenced messages (if any) belong to the same conversation/dataroom
      if (
        data.sourceConversationId &&
        (data.questionMessageId || data.answerMessageId)
      ) {
        const msgs = await prisma.message.findMany({
          where: {
            id: {
              in: [data.questionMessageId, data.answerMessageId].filter(
                Boolean,
              ) as string[],
            },
            conversation: { id: data.sourceConversationId, dataroomId },
          },
          select: { id: true },
        });
        const providedCount = [
          data.questionMessageId,
          data.answerMessageId,
        ].filter(Boolean).length;
        if (msgs.length !== providedCount) {
          return res.status(400).json({
            error:
              "Message references must belong to the specified conversation and dataroom",
          });
        }
      }

      // Create the published FAQ
      const publishedFAQ = await prisma.dataroomFaqItem.create({
        data: {
          editedQuestion: createSanitizedQuestion,
          originalQuestion: data.originalQuestion
            ? validateContent(data.originalQuestion)
            : null,
          answer: createSanitizedAnswer,
          dataroomId,
          linkId: data.linkId,
          dataroomDocumentId: data.dataroomDocumentId,
          sourceConversationId: data.sourceConversationId,
          questionMessageId: data.questionMessageId,
          answerMessageId: data.answerMessageId,
          teamId,
          publishedByUserId: userId,
          visibilityMode: data.visibilityMode,
          isAnonymized: data.isAnonymized ?? true,
          documentPageNumber: data.documentPageNumber,
          documentVersionNumber: data.documentVersionNumber,
        },
        include: {
          dataroom: {
            select: { name: true },
          },
          link: {
            select: { name: true },
          },
          dataroomDocument: {
            include: {
              document: {
                select: { name: true },
              },
            },
          },
          publishedByUser: {
            select: { name: true, email: true },
          },
        },
      });

      return res.status(201).json(publishedFAQ);
    } catch (error) {
      console.error("Error publishing FAQ:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  // GET /api/teams/[teamId]/datarooms/[id]/faqs
  "GET /": async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      // Validate URL parameters
      const paramValidation = paramSchema.safeParse({
        teamId: req.query.teamId,
        id: req.query.id,
      });

      if (!paramValidation.success) {
        return res.status(400).json({
          error: "Invalid parameters",
          details: paramValidation.error.errors[0]?.message,
        });
      }

      const { teamId, id: dataroomId } = paramValidation.data;
      const userId = (session.user as CustomUser).id;
      // Verify team access to dataroom
      const dataroom = await prisma.dataroom.findUnique({
        where: {
          id: dataroomId,
          team: {
            id: teamId,
            users: { some: { userId } },
          },
        },
        select: {
          id: true,
        },
      });

      if (!dataroom) {
        return res.status(404).json({ error: "Dataroom not found" });
      }

      // Get published FAQs for this dataroom
      const faqs = await prisma.dataroomFaqItem.findMany({
        where: {
          dataroomId,
        },
        include: {
          dataroom: {
            select: { name: true },
          },
          link: {
            select: { name: true },
          },
          dataroomDocument: {
            include: {
              document: {
                select: { name: true },
              },
            },
          },
          publishedByUser: {
            select: { name: true, email: true },
          },
          sourceConversation: {
            select: { id: true },
          },
          questionMessage: {
            select: { id: true, content: true },
          },
          answerMessage: {
            select: { id: true, content: true },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.status(200).json(faqs);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  // PUT /api/teams/[teamId]/datarooms/[id]/faqs/[faqId]
  "PUT /[faqId]": async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      // Validate URL parameters
      const paramValidation = paramSchema.safeParse({
        teamId: req.query.teamId,
        id: req.query.id,
        faqId: req.query.faqId,
      });

      if (!paramValidation.success) {
        return res.status(400).json({
          error: "Invalid parameters",
          details: paramValidation.error.errors[0]?.message,
        });
      }

      const { teamId, id: dataroomId, faqId } = paramValidation.data;

      // Validate request body
      const bodyValidation = updateFAQSchema.safeParse(req.body);

      if (!bodyValidation.success) {
        return res.status(400).json({
          error: "Invalid request data",
          details: bodyValidation.error.errors[0]?.message,
        });
      }

      const data = bodyValidation.data;
      const userId = (session.user as CustomUser).id;
      // Verify team access and FAQ ownership
      const existingFAQ = await prisma.dataroomFaqItem.findFirst({
        where: {
          id: faqId,
          dataroomId,
          dataroom: {
            team: {
              id: teamId,
              users: { some: { userId } },
            },
          },
        },
      });

      if (!existingFAQ) {
        return res.status(404).json({ error: "FAQ not found" });
      }

      // Prepare update data
      const updateData: any = {};

      if (data.editedQuestion)
        updateData.editedQuestion = validateContent(data.editedQuestion);
      if (data.answer) updateData.answer = validateContent(data.answer);

      if (data.status !== undefined) updateData.status = data.status;
      if (data.visibilityMode !== undefined)
        updateData.visibilityMode = data.visibilityMode;

      // Update the FAQ
      const updatedFAQ = await prisma.dataroomFaqItem.update({
        where: { id: faqId },
        data: updateData,
        include: {
          dataroom: {
            select: { name: true },
          },
          link: {
            select: { name: true },
          },
          dataroomDocument: {
            include: {
              document: {
                select: { name: true },
              },
            },
          },
          publishedByUser: {
            select: { name: true, email: true },
          },
        },
      });

      return res.status(200).json(updatedFAQ);
    } catch (error) {
      console.error("Error updating FAQ:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  // DELETE /api/teams/[teamId]/datarooms/[id]/faqs/[faqId]
  "DELETE /[faqId]": async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      // Validate URL parameters
      const paramValidation = paramSchema.safeParse({
        teamId: req.query.teamId,
        id: req.query.id,
        faqId: req.query.faqId,
      });

      if (!paramValidation.success) {
        return res.status(400).json({
          error: "Invalid parameters",
          details: paramValidation.error.errors[0]?.message,
        });
      }

      const { teamId, id: dataroomId, faqId } = paramValidation.data;
      const userId = (session.user as CustomUser).id;
      // Verify team access and FAQ ownership
      const existingFAQ = await prisma.dataroomFaqItem.findFirst({
        where: {
          id: faqId,
          dataroomId,
          dataroom: {
            team: {
              id: teamId,
              users: { some: { userId } },
            },
          },
        },
      });

      if (!existingFAQ) {
        return res.status(404).json({ error: "FAQ not found" });
      }

      // Delete the FAQ (cascade will handle votes)
      await prisma.dataroomFaqItem.delete({
        where: { id: faqId },
      });

      return res.status(200).json({ message: "FAQ deleted successfully" });
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
};

// Main handler function that routes to appropriate handler based on method and path
export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const method = req.method;
  let path = "/";

  // Extract path from query parameters for nested routes
  if (req.query.faqId) {
    path = `/[faqId]`;
  }

  const handlerKey = `${method} ${path}`;
  const handler = routeHandlers[handlerKey as keyof typeof routeHandlers];

  if (handler) {
    await handler(req, res);
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
