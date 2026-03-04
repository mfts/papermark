import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

const routeHandlers = {
  // GET /api/teams/[teamId]/datarooms/[dataroomId]/proposed-questions
  "GET /": async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = (session.user as CustomUser).id;
    const { teamId, id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };

    try {
      const dataroom = await prisma.dataroom.findUnique({
        where: {
          id: dataroomId,
          team: {
            id: teamId,
            users: { some: { userId } },
          },
        },
        select: { id: true },
      });

      if (!dataroom) {
        return res.status(404).json({ error: "Dataroom not found" });
      }

      const questions = await prisma.dataroomProposedQuestion.findMany({
        where: { dataroomId },
        include: {
          link: { select: { id: true, name: true } },
          dataroomDocument: {
            include: {
              document: { select: { name: true } },
            },
          },
          createdByUser: { select: { name: true, email: true } },
          _count: {
            select: { conversations: true },
          },
        },
        orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
      });

      return res.status(200).json(questions);
    } catch (error) {
      console.error("Error fetching proposed questions:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  // POST /api/teams/[teamId]/datarooms/[dataroomId]/proposed-questions
  "POST /": async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = (session.user as CustomUser).id;
    const { teamId, id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };

    const { question, description, linkId, dataroomDocumentId, orderIndex } =
      req.body as {
        question: string;
        description?: string;
        linkId?: string;
        dataroomDocumentId?: string;
        orderIndex?: number;
      };

    if (!question || question.trim() === "") {
      return res.status(400).json({ error: "Question text is required" });
    }

    try {
      const dataroom = await prisma.dataroom.findUnique({
        where: {
          id: dataroomId,
          team: {
            id: teamId,
            users: { some: { userId } },
          },
        },
        select: { id: true, teamId: true },
      });

      if (!dataroom) {
        return res.status(404).json({ error: "Dataroom not found" });
      }

      if (linkId) {
        const link = await prisma.link.findFirst({
          where: { id: linkId, dataroomId },
        });
        if (!link) {
          return res
            .status(400)
            .json({ error: "Invalid link for this dataroom" });
        }
      }

      if (dataroomDocumentId) {
        const doc = await prisma.dataroomDocument.findFirst({
          where: { id: dataroomDocumentId, dataroomId },
        });
        if (!doc) {
          return res
            .status(400)
            .json({ error: "Invalid document for this dataroom" });
        }
      }

      const maxOrder = await prisma.dataroomProposedQuestion.aggregate({
        where: { dataroomId },
        _max: { orderIndex: true },
      });

      const newQuestion = await prisma.dataroomProposedQuestion.create({
        data: {
          question: question.trim(),
          description: description?.trim() || null,
          dataroomId,
          linkId: linkId || null,
          dataroomDocumentId: dataroomDocumentId || null,
          teamId: dataroom.teamId,
          createdByUserId: userId,
          orderIndex: orderIndex ?? (maxOrder._max.orderIndex ?? -1) + 1,
        },
        include: {
          link: { select: { id: true, name: true } },
          dataroomDocument: {
            include: {
              document: { select: { name: true } },
            },
          },
          createdByUser: { select: { name: true, email: true } },
          _count: {
            select: { conversations: true },
          },
        },
      });

      return res.status(201).json(newQuestion);
    } catch (error) {
      console.error("Error creating proposed question:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  // PUT /api/teams/[teamId]/datarooms/[dataroomId]/proposed-questions/[questionId]
  "PUT /[questionId]": async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = (session.user as CustomUser).id;
    const { teamId, id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };
    const questionId = req.query.questionId as string;

    const { question, description, linkId, dataroomDocumentId, orderIndex, status } =
      req.body as {
        question?: string;
        description?: string;
        linkId?: string | null;
        dataroomDocumentId?: string | null;
        orderIndex?: number;
        status?: "ACTIVE" | "ARCHIVED";
      };

    try {
      const existing = await prisma.dataroomProposedQuestion.findFirst({
        where: {
          id: questionId,
          dataroomId,
          dataroom: {
            team: {
              id: teamId,
              users: { some: { userId } },
            },
          },
        },
      });

      if (!existing) {
        return res.status(404).json({ error: "Proposed question not found" });
      }

      if (linkId) {
        const link = await prisma.link.findFirst({
          where: { id: linkId, dataroomId },
        });
        if (!link) {
          return res
            .status(400)
            .json({ error: "Invalid link for this dataroom" });
        }
      }

      if (dataroomDocumentId) {
        const doc = await prisma.dataroomDocument.findFirst({
          where: { id: dataroomDocumentId, dataroomId },
        });
        if (!doc) {
          return res
            .status(400)
            .json({ error: "Invalid document for this dataroom" });
        }
      }

      const updateData: Record<string, unknown> = {};
      if (question !== undefined) updateData.question = question.trim();
      if (description !== undefined)
        updateData.description = description?.trim() || null;
      if (linkId !== undefined) updateData.linkId = linkId || null;
      if (dataroomDocumentId !== undefined)
        updateData.dataroomDocumentId = dataroomDocumentId || null;
      if (orderIndex !== undefined) updateData.orderIndex = orderIndex;
      if (status !== undefined) updateData.status = status;

      const updated = await prisma.dataroomProposedQuestion.update({
        where: { id: questionId },
        data: updateData,
        include: {
          link: { select: { id: true, name: true } },
          dataroomDocument: {
            include: {
              document: { select: { name: true } },
            },
          },
          createdByUser: { select: { name: true, email: true } },
          _count: {
            select: { conversations: true },
          },
        },
      });

      return res.status(200).json(updated);
    } catch (error) {
      console.error("Error updating proposed question:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  // DELETE /api/teams/[teamId]/datarooms/[dataroomId]/proposed-questions/[questionId]
  "DELETE /[questionId]": async (
    req: NextApiRequest,
    res: NextApiResponse,
  ) => {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = (session.user as CustomUser).id;
    const { teamId, id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };
    const questionId = req.query.questionId as string;

    try {
      const existing = await prisma.dataroomProposedQuestion.findFirst({
        where: {
          id: questionId,
          dataroomId,
          dataroom: {
            team: {
              id: teamId,
              users: { some: { userId } },
            },
          },
        },
      });

      if (!existing) {
        return res.status(404).json({ error: "Proposed question not found" });
      }

      await prisma.dataroomProposedQuestion.delete({
        where: { id: questionId },
      });

      return res
        .status(200)
        .json({ message: "Proposed question deleted successfully" });
    } catch (error) {
      console.error("Error deleting proposed question:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
};

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const method = req.method;
  let path = "/";

  if (req.query.questionId) {
    path = "/[questionId]";
  }

  const handlerKey = `${method} ${path}`;
  const handler = routeHandlers[handlerKey as keyof typeof routeHandlers];

  if (handler) {
    await handler(req, res);
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
