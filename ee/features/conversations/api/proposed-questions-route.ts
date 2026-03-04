import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { verifyDataroomSession } from "@/lib/auth/dataroom-auth";
import prisma from "@/lib/prisma";

const visitorProposedQuestionsParamsSchema = z.object({
  linkId: z.string().cuid("Invalid link ID format"),
  dataroomId: z.string().cuid("Invalid dataroom ID format"),
  documentId: z.string().cuid("Invalid document ID format").nullish(),
  viewerId: z.string().cuid("Invalid viewer ID format").nullish(),
});

export interface VisitorProposedQuestionResponse {
  id: string;
  question: string;
  description: string | null;
  orderIndex: number;
  hasResponded: boolean;
  conversationId: string | null;
  createdAt: string;
  document?: {
    name: string;
  };
}

export async function handleGetProposedQuestions(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const paramValidation = visitorProposedQuestionsParamsSchema.safeParse({
      linkId: searchParams.get("linkId"),
      dataroomId: searchParams.get("dataroomId"),
      documentId: searchParams.get("documentId"),
      viewerId: searchParams.get("viewerId"),
    });

    if (!paramValidation.success) {
      return NextResponse.json(
        {
          error: "Invalid parameters",
          details: paramValidation.error.errors[0]?.message,
        },
        { status: 400 },
      );
    }

    const { linkId, dataroomId, documentId, viewerId } =
      paramValidation.data;

    const session = await verifyDataroomSession(req, linkId, dataroomId);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - invalid or expired session" },
        { status: 401 },
      );
    }

    const scopeFilters: Record<string, unknown>[] = [
      { linkId: null, dataroomDocumentId: null },
    ];

    if (linkId) {
      scopeFilters.push({ linkId, dataroomDocumentId: null });
    }

    if (documentId) {
      scopeFilters.push({ dataroomDocumentId: documentId });
    }

    const questions = await prisma.dataroomProposedQuestion.findMany({
      where: {
        dataroomId,
        status: "ACTIVE",
        OR: scopeFilters,
      },
      select: {
        id: true,
        question: true,
        description: true,
        orderIndex: true,
        createdAt: true,
        dataroomDocument: {
          select: {
            document: {
              select: { name: true },
            },
          },
        },
        conversations: viewerId
          ? {
              where: {
                participants: {
                  some: { viewerId },
                },
              },
              select: { id: true },
              take: 1,
            }
          : false,
      },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
    });

    const response: VisitorProposedQuestionResponse[] = questions.map(
      (q: any) => ({
        id: q.id,
        question: q.question,
        description: q.description,
        orderIndex: q.orderIndex,
        hasResponded: viewerId
          ? (q.conversations?.length ?? 0) > 0
          : false,
        conversationId: viewerId
          ? q.conversations?.[0]?.id ?? null
          : null,
        createdAt: q.createdAt.toISOString(),
        document: q.dataroomDocument?.document
          ? { name: q.dataroomDocument.document.name }
          : undefined,
      }),
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching visitor proposed questions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
