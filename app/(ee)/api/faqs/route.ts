import { NextRequest, NextResponse } from "next/server";

import { verifyDataroomSession } from "@/lib/auth/dataroom-auth";
import prisma from "@/lib/prisma";

export interface VisitorFAQResponse {
  id: string;
  editedQuestion: string;
  answer: string;
  documentPageNumber?: number;
  documentVersionNumber?: number;
  createdAt: string;
  document?: {
    name: string;
  };
}

// GET /api/faqs?linkId=xxx&dataroomId=xxx - List published FAQs for visitors
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const linkId = searchParams.get("linkId");
    const dataroomId = searchParams.get("dataroomId");
    const documentId = searchParams.get("documentId");

    if (!linkId || !dataroomId) {
      return NextResponse.json(
        { error: "linkId and dataroomId are required" },
        { status: 400 },
      );
    }

    // Verify dataroom session
    const session = await verifyDataroomSession(req, linkId, dataroomId);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - invalid or expired session" },
        { status: 401 },
      );
    }

    // Build where clause based on visibility filters
    const whereClause: any = {
      dataroomId,
      status: "PUBLISHED",
    };

    // Apply visibility filters
    const visibilityFilters: any[] = [
      { visibilityMode: "PUBLIC_DATAROOM" }, // Always include dataroom-wide FAQs
    ];

    if (linkId) {
      visibilityFilters.push({
        visibilityMode: "PUBLIC_LINK",
        linkId: linkId,
      });
    }

    if (documentId) {
      visibilityFilters.push({
        visibilityMode: "PUBLIC_DOCUMENT",
        dataroomDocumentId: documentId,
      });
    }

    whereClause.OR = visibilityFilters;

    // Fetch published FAQs
    const faqs = await prisma.dataroomFaqItem.findMany({
      where: whereClause,
      select: {
        id: true,
        editedQuestion: true,
        answer: true,
        documentPageNumber: true,
        documentVersionNumber: true,
        createdAt: true,
        dataroomDocument: {
          select: {
            document: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format response
    const response: VisitorFAQResponse[] = faqs.map((faq: any) => ({
      id: faq.id,
      editedQuestion: faq.editedQuestion,
      answer: faq.answer,
      documentPageNumber: faq.documentPageNumber || undefined,
      documentVersionNumber: faq.documentVersionNumber || undefined,
      createdAt: faq.createdAt.toISOString(),
      document: faq.dataroomDocument?.document
        ? {
            name: faq.dataroomDocument.document.name,
          }
        : undefined,
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching visitor FAQs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
