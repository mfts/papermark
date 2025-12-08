import { NextRequest, NextResponse } from "next/server";

import { processDocumentForVectorStore } from "@/ee/features/ai/lib/file-processing/process-document-for-vector-store";
import { createTeamVectorStore } from "@/ee/features/ai/lib/vector-stores/create-team-vector-store";
import { removeFileFromVectorStore } from "@/ee/features/ai/lib/vector-stores/remove-file-from-vector-store";
import { addFileToVectorStore } from "@/ee/features/ai/lib/vector-stores/upload-file-to-vector-store";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";

import { getFeatureFlags } from "@/lib/featureFlags";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

/**
 * POST /api/ai/store/teams/[teamId]/documents/[documentId]
 * Index a single document into the team vector store
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { documentId: string; teamId: string } },
) {
  try {
    const { documentId, teamId } = params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as CustomUser).id;

    // Verify user is member of team
    const userTeam = await prisma.userTeam.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    if (!userTeam) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if AI feature is enabled for this team
    const features = await getFeatureFlags({ teamId });
    if (!features.ai) {
      return NextResponse.json(
        { error: "AI features are not available for this team" },
        { status: 403 },
      );
    }

    // Get document and version
    const document = await prisma.document.findUnique({
      where: { id: documentId, teamId },
      include: {
        team: {
          select: {
            agentsEnabled: true,
            vectorStoreId: true,
            name: true,
          },
        },
        versions: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    // Check if team has AI enabled
    if (!document.team.agentsEnabled) {
      return NextResponse.json(
        { error: "AI agents are not enabled for this team" },
        { status: 403 },
      );
    }

    if (!document.agentsEnabled) {
      return NextResponse.json(
        { error: "AI agents are not enabled for this document" },
        { status: 403 },
      );
    }

    const primaryVersion = document.versions[0];

    if (!primaryVersion) {
      return NextResponse.json(
        { error: "No primary version found for this document" },
        { status: 400 },
      );
    }

    // Create or get team vector store
    let vectorStoreId = document.team.vectorStoreId;

    if (!vectorStoreId) {
      vectorStoreId = await createTeamVectorStore(
        document.teamId,
        document.team.name,
      );

      // Update team with vector store ID
      await prisma.team.update({
        where: { id: document.teamId },
        data: { vectorStoreId },
      });
    }

    // Check if document type is supported
    const supportedTypes = ["application/pdf"];
    if (!supportedTypes.includes(primaryVersion.contentType || "")) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${primaryVersion.contentType}. Only PDF files are supported.`,
        },
        { status: 400 },
      );
    }

    let fileId = primaryVersion.fileId;

    if (!fileId) {
      const { fileId: newFileId } = await processDocumentForVectorStore(
        primaryVersion.file,
        primaryVersion.storageType,
      );

      // Update document version with file ID
      await prisma.documentVersion.update({
        where: { id: primaryVersion.id },
        data: { fileId: newFileId },
      });

      fileId = newFileId;
    }

    const metadata = {
      teamId: document.teamId,
      documentId: document.id,
      documentName: document.name,
      versionId: primaryVersion.id,
      folderId: document.folderId || "root",
    };

    // Add to vector store
    const vectorStoreFileId = await addFileToVectorStore({
      vectorStoreId,
      fileId,
      metadata,
    });

    // Update document version with vector store file ID
    await prisma.documentVersion.update({
      where: { id: primaryVersion.id },
      data: { vectorStoreFileId },
    });

    return NextResponse.json({
      success: true,
      vectorStoreFileId,
      vectorStoreId,
    });
  } catch (error) {
    console.error("Error indexing document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/ai/store/teams/[teamId]/documents/[documentId]
 * Remove a document from the team vector store
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { documentId: string; teamId: string } },
) {
  try {
    const { documentId, teamId } = params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as CustomUser).id;

    // Verify user is member of team
    const userTeam = await prisma.userTeam.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    if (!userTeam) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get document and verify user access
    const document = await prisma.document.findUnique({
      where: { id: documentId, teamId },
      include: {
        team: {
          select: {
            vectorStoreId: true,
          },
        },
        versions: {
          where: { isPrimary: true },
          take: 1,
          select: {
            id: true,
            vectorStoreFileId: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    // Check if AI feature is enabled for this team
    const features = await getFeatureFlags({ teamId: document.teamId });
    if (!features.ai) {
      return NextResponse.json(
        { error: "AI features are not available for this team" },
        { status: 403 },
      );
    }

    const primaryVersion = document.versions[0];
    const vectorStoreId = document.team.vectorStoreId;

    if (!primaryVersion?.vectorStoreFileId || !vectorStoreId) {
      return NextResponse.json(
        { error: "Document is not indexed" },
        { status: 400 },
      );
    }

    // Remove file from vector store
    await removeFileFromVectorStore(
      vectorStoreId,
      primaryVersion.vectorStoreFileId,
    );

    // Clear vector store file ID
    await prisma.documentVersion.update({
      where: { id: primaryVersion.id },
      data: { vectorStoreFileId: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing document from vector store:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
