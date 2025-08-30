import { NextRequest, NextResponse } from "next/server";

import { processDocument } from "@/lib/api/documents/process-document";
import { verifyDataroomSession } from "@/lib/auth/dataroom-auth";
import { DocumentData } from "@/lib/documents/create-document";
import prisma from "@/lib/prisma";
import { supportsAdvancedExcelMode } from "@/lib/utils/get-content-type";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const linkId = params.id;
    const body = await request.json();
    const { documentData, dataroomId, folderId } = body as {
      documentData: DocumentData;
      dataroomId: string;
      folderId?: string;
    };

    if (!linkId || !documentData || !dataroomId) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 },
      );
    }

    // 0. Verify the dataroom session
    const dataroomSession = await verifyDataroomSession(
      request,
      linkId,
      dataroomId,
    );

    if (!dataroomSession || !dataroomSession.viewerId) {
      return NextResponse.json(
        { message: "You need to be logged in to upload a document." },
        { status: 401 },
      );
    }

    // Check if the link exists and has visitor upload enabled
    const link = await prisma.link.findUnique({
      where: { id: linkId, dataroomId },
      select: {
        id: true,
        enableUpload: true,
        uploadFolderId: true,
        dataroomId: true,
        teamId: true,
        team: {
          select: {
            plan: true,
            enableExcelAdvancedMode: true,
          },
        },
      },
    });

    if (
      !link ||
      !link.enableUpload ||
      link.dataroomId !== dataroomId ||
      !link.teamId
    ) {
      return NextResponse.json(
        { message: "Uploads not allowed for this link" },
        { status: 403 },
      );
    }

    const { viewerId, viewId } = dataroomSession;

    // Check if the viewer exists
    const viewer = await prisma.viewer.findUnique({
      where: {
        id: viewerId,
        teamId: link.teamId,
        views: { some: { id: viewId } },
      },
      select: { id: true },
    });

    if (!viewer) {
      return NextResponse.json(
        { message: "Viewer not found" },
        { status: 404 },
      );
    }


    const updatedDocumentData = {
      ...documentData,
      enableExcelAdvancedMode: documentData.supportedFileType === "sheet" &&
        link.team?.enableExcelAdvancedMode &&
        supportsAdvancedExcelMode(documentData.contentType),
    };

    // 1. Create the document
    const document = await processDocument({
      documentData: updatedDocumentData,
      teamId: link.teamId,
      teamPlan: link.team?.plan ?? "free",
      isExternalUpload: true,
    });

    // 2. Create the dataroom document
    // If folderId is provided and link has no uploadFolderId, use folderId as the dataroomFolderId
    // Otherwise, use the link's uploadFolderId
    // or null if it doesn't exist
    let dataroomFolderId: string | null = folderId ?? null;
    if (link.uploadFolderId) {
      const dataroomFolder = await prisma.dataroomFolder.findUnique({
        where: {
          id: link.uploadFolderId,
          dataroomId,
        },
        select: {
          id: true,
        },
      });
      dataroomFolderId = dataroomFolder?.id ?? null;
    }

    const newDataroomDocument = await prisma.dataroomDocument.create({
      data: {
        dataroomId: dataroomId,
        documentId: document.id,
        folderId: dataroomFolderId,
      },
    });

    // 3. Create the DocumentUpload record to track the upload details
    await prisma.documentUpload.create({
      data: {
        documentId: document.id,
        viewerId: viewerId,
        viewId: viewId,
        linkId: linkId,
        originalFilename: document.name,
        fileSize: document.versions[0].fileSize,
        numPages: document.numPages,
        mimeType: document.contentType,
        dataroomId: dataroomId,
        dataroomDocumentId: newDataroomDocument.id,
        teamId: link.teamId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { message: "Error uploading document" },
      { status: 500 },
    );
  }
}
