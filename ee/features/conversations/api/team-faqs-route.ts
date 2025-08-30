import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { validateContent } from "@/lib/utils/sanitize-html";

export interface PublishFAQInput {
  title?: string;
  editedQuestion: string;
  originalQuestion?: string;
  answer: string;
  description?: string;
  linkId?: string;
  dataroomDocumentId?: string;
  sourceConversationId?: string;
  questionMessageId?: string;
  answerMessageId?: string;
  visibilityMode: "PUBLIC_DATAROOM" | "PUBLIC_LINK" | "PUBLIC_DOCUMENT";
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isAnonymized?: boolean;
  tags?: string[];
  documentPageNumber?: number;
  documentVersionNumber?: number;
}

// Route mapping object to handle different paths
const routeHandlers = {
  // POST /api/teams/[teamId]/datarooms/[dataroomId]/faq
  "POST /": async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { teamId, id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };

    const userId = (session.user as CustomUser).id;
    const data = req.body as PublishFAQInput;

    try {
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

      // Validate required fields
      if (!data.editedQuestion || !data.answer) {
        return res.status(400).json({
          error: "Question and answer are required",
        });
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

      // Sanitize content
      const sanitizedQuestion = validateContent(data.editedQuestion);
      const sanitizedAnswer = validateContent(data.answer);

      // Create the published FAQ
      const publishedFAQ = await prisma.dataroomFaqItem.create({
        data: {
          title: data.title,
          editedQuestion: sanitizedQuestion,
          originalQuestion: data.originalQuestion
            ? validateContent(data.originalQuestion)
            : null,
          answer: sanitizedAnswer,
          description: data.description
            ? validateContent(data.description)
            : null,
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
          tags: data.tags || [],
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

  // GET /api/teams/[teamId]/datarooms/[id]/faq
  "GET /": async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { teamId, id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };

    const userId = (session.user as CustomUser).id;

    try {
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

  // PUT /api/teams/[teamId]/datarooms/[id]/faq/[faqId]
  "PUT /[faqId]": async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      teamId,
      id: dataroomId,
      faqId,
    } = req.query as {
      teamId: string;
      id: string;
      faqId: string;
    };

    const userId = (session.user as CustomUser).id;
    const data = req.body as Partial<PublishFAQInput>;

    try {
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

      if (data.title !== undefined) updateData.title = data.title;
      if (data.editedQuestion)
        updateData.editedQuestion = validateContent(data.editedQuestion);
      if (data.answer) updateData.answer = validateContent(data.answer);
      if (data.description !== undefined)
        updateData.description = data.description
          ? validateContent(data.description)
          : null;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.visibilityMode !== undefined)
        updateData.visibilityMode = data.visibilityMode;
      if (data.tags !== undefined) updateData.tags = data.tags;

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

  // DELETE /api/teams/[teamId]/datarooms/[id]/faq/[faqId]
  "DELETE /[faqId]": async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      teamId,
      id: dataroomId,
      faqId,
    } = req.query as {
      teamId: string;
      id: string;
      faqId: string;
    };

    const userId = (session.user as CustomUser).id;

    try {
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
