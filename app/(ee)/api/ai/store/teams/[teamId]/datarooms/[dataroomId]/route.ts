import { NextRequest, NextResponse } from "next/server";

import { processDocumentForVectorStore } from "@/ee/features/ai/lib/file-processing/process-document-for-vector-store";
import { createDataroomVectorStore } from "@/ee/features/ai/lib/vector-stores/create-dataroom-vector-store";
import { addFileToVectorStore } from "@/ee/features/ai/lib/vector-stores/upload-file-to-vector-store";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";

import { getFeatureFlags } from "@/lib/featureFlags";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

/**
 * POST /api/ai/store/teams/[teamId]/datarooms/[dataroomId]
 * Index all documents in a dataroom into its vector store
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { dataroomId: string; teamId: string } },
) {
  try {
    const { dataroomId, teamId } = params;
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

    // Get dataroom and documents
    const dataroom = await prisma.dataroom.findUnique({
      where: {
        id: dataroomId,
        teamId,
      },
      include: {
        team: {
          select: {
            agentsEnabled: true,
          },
        },
        documents: {
          include: {
            document: {
              include: {
                versions: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!dataroom) {
      return NextResponse.json(
        { error: "Dataroom not found" },
        { status: 404 },
      );
    }

    // Check if team has AI enabled
    if (!dataroom.team.agentsEnabled) {
      return NextResponse.json(
        { error: "AI agents are not enabled for this team" },
        { status: 403 },
      );
    }

    if (!dataroom.agentsEnabled) {
      return NextResponse.json(
        { error: "AI agents are not enabled for this dataroom" },
        { status: 403 },
      );
    }

    // Create or get vector store
    let vectorStoreId = dataroom.vectorStoreId;

    if (!vectorStoreId) {
      vectorStoreId = await createDataroomVectorStore({
        dataroomId,
        teamId: dataroom.teamId,
        name: dataroom.name,
      });

      // Update dataroom with vector store ID
      await prisma.dataroom.update({
        where: { id: dataroomId },
        data: { vectorStoreId },
      });
    }

    // Process and upload documents
    let filesIndexed = 0;
    const errors: string[] = [];

    for (const dataroomDoc of dataroom.documents) {
      const document = dataroomDoc.document;
      const primaryVersion = document.versions[0];

      if (!primaryVersion) {
        errors.push(`No primary version for document: ${document.name}`);
        continue;
      }

      // Skip if already indexed
      if (dataroomDoc.vectorStoreFileId) {
        filesIndexed++;
        continue;
      }

      try {
        // Check if document type is supported
        const supportedTypes = ["application/pdf"];
        if (!supportedTypes.includes(primaryVersion.contentType || "")) {
          errors.push(
            `Unsupported file type for document: ${document.name} (${primaryVersion.contentType})`,
          );
          continue;
        }

        // get version's fileId
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
          teamId: dataroom.teamId,
          documentId: document.id,
          documentName: document.name,
          versionId: primaryVersion.id,
          dataroomId: dataroom.id,
          dataroomDocumentId: dataroomDoc.id,
          dataroomFolderId: dataroomDoc.folderId || "root",
        };

        // Add to vector store
        const vectorStoreFileId = await addFileToVectorStore({
          vectorStoreId,
          fileId,
          metadata,
        });

        // Update dataroom document with vector store file ID
        await prisma.dataroomDocument.update({
          where: { id: dataroomDoc.id },
          data: { vectorStoreFileId },
        });

        filesIndexed++;
      } catch (error) {
        console.error(`Error indexing document ${document.name}:`, error);
        errors.push(
          `Failed to index document: ${document.name} - ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    return NextResponse.json({
      success: true,
      filesIndexed,
      totalDocuments: dataroom.documents.length,
      vectorStoreId,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error indexing dataroom:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
