
import prisma from "@/lib/prisma";

export async function saveMarkdownToDB(
    documentId: string,
    markdownContent: string,
    teamId: string,
    doclingTimeMs: number,
    chunkingTimeMs: number
): Promise<void> {
    try {
        await prisma.document.update({
            where: {
                id: documentId,
                teamId
            },
            data: {
                markdownContent: markdownContent,
                markdownProcessedAt: new Date(),
                doclingTimeMs: doclingTimeMs || null,
                chunkingTimeMs: chunkingTimeMs || null
            }
        });
    } catch (error) {
        console.error(`❌ Failed to save markdown for document ${documentId}:`, error);
    }
}

export interface ChunkData {
    id: string;
    content: string;
    chunkIndex: number;
    chunkHash: string;
    dataroomId: string;
    teamId: string;
    contentType?: string;
    pageRanges?: string;
    tokenCount?: number;
    sectionHeader?: string;
    headerHierarchy?: string; // JSON string of array
    isSmallChunk?: boolean;
    vectorId?: string;
}

export async function saveChunksToDB(
    documentId: string,
    chunks: ChunkData[]
): Promise<void> {
    try {
        await prisma.documentChunk.deleteMany({
            where: {
                documentId: documentId
            }
        });

        // Insert new chunks
        await prisma.documentChunk.createMany({
            data: chunks.map(chunk => ({
                documentId: documentId,
                content: chunk.content,
                chunkIndex: chunk.chunkIndex,
                chunkHash: chunk.chunkHash,
                dataroomId: chunk.dataroomId,
                teamId: chunk.teamId,
                contentType: chunk.contentType,
                pageRanges: chunk.pageRanges,
                tokenCount: chunk.tokenCount,
                sectionHeader: chunk.sectionHeader,
                headerHierarchy: chunk.headerHierarchy,
                isSmallChunk: chunk.isSmallChunk,
                vectorId: chunk?.vectorId || null
            }))
        });
    } catch (error) {
        console.error(`❌ Failed to save chunks for document ${documentId}:`, error);
    }
}
