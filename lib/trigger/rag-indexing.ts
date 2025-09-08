import { ParsingStatus } from "@prisma/client";
import { logger, task } from "@trigger.dev/sdk/v3";
import { randomUUID } from "crypto";
import pLimit from "p-limit";

import prisma from "@/lib/prisma";
import {
  DocumentProcessingResult,
  DocumentProcessor,
} from "@/lib/rag/document-processor";
import { EmbeddingGenerator } from "@/lib/rag/embedding-generator";
import { getErrorMessage } from "@/lib/rag/errors";
import { vectorManager } from "@/lib/rag/vector-manager";

import { RAGQueueManager } from "../rag/queue-manager";

const DOCUMENT_PROCESSING_CONCURRENCY = 8;
const VECTOR_UPSERT_CONCURRENCY = 15;
const PRESIGNED_URL_CONCURRENCY = 25;

// Types for the indexing pipeline
export interface RAGIndexingPayload {
  dataroomId: string;
  teamId: string;
  userId: string;
  processingId?: string;
}

export interface DataroomRAGStatus {
  totalDocuments: number;
  indexedDocuments: number;
  allIndexed: boolean;
  needsIndexing: boolean;
  unindexedDocumentIds: string[];
}

export interface IndexingJobResult {
  success: boolean;
  documentsProcessed: number;
  documentsSkipped: number;
  chunksProcessed: number;
  vectorsStored: number;
  embeddingTokens: number;
  error?: string;
  processingId: string;
}

export const ragIndexingTask = task({
  id: "rag-indexing",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30000,
  },
  maxDuration: 3600, // 1 hour max
  run: async (payload: RAGIndexingPayload): Promise<IndexingJobResult> => {
    const processingId = payload.processingId || randomUUID();
    let documentProcessor: DocumentProcessor | null = null;
    let embeddingGenerator: EmbeddingGenerator | null = null;

    logger.info("RAG indexing worker starting", {
      dataroomId: payload.dataroomId,
      teamId: payload.teamId,
      processingId,
    });

    try {
      const isLockValid = await RAGQueueManager.isIndexingRunning(
        payload.dataroomId,
      );

      if (!isLockValid) {
        logger.info("Lock was lost or expired, exiting gracefully", {
          dataroomId: payload.dataroomId,
          processingId,
        });

        return {
          success: true,
          documentsProcessed: 0,
          documentsSkipped: 0,
          chunksProcessed: 0,
          vectorsStored: 0,
          processingId,
          embeddingTokens: 0,
        };
      }

      logger.info("Lock is valid, starting to process queue", {
        dataroomId: payload.dataroomId,
        processingId,
      });

      // STEP 2: Work the entire queue in a loop until empty
      let totalDocumentsProcessed = 0;
      let totalDocumentsSkipped = 0;
      let totalChunksProcessed = 0;
      let totalVectorsStored = 0;
      let totalEmbeddingTokens = 0;

      while (true) {
        const nextRequest = await RAGQueueManager.getNextFromQueue(
          payload.dataroomId,
        );

        if (!nextRequest) {
          logger.info("No more requests in queue, worker finished", {
            dataroomId: payload.dataroomId,
            processingId,
            totalDocumentsProcessed,
            totalDocumentsSkipped,
          });
          break;
        }

        logger.info("Processing next request from queue", {
          dataroomId: payload.dataroomId,
          processingId,
          request: nextRequest,
        });

        // Process this request
        try {
          const result = await processRAGIndexingRequest(
            nextRequest,
            processingId,
            documentProcessor,
            embeddingGenerator,
          );

          // Update totals
          totalDocumentsProcessed += result.documentsProcessed;
          totalDocumentsSkipped += result.documentsSkipped;
          totalChunksProcessed += result.chunksProcessed;
          totalVectorsStored += result.vectorsStored;
          totalEmbeddingTokens += result.embeddingTokens;

          // Update document processor instances for reuse
          documentProcessor = result.documentProcessor;
          embeddingGenerator = result.embeddingGenerator;

          logger.info("Request processed successfully", {
            dataroomId: payload.dataroomId,
            processingId,
            result: {
              documentsProcessed: result.documentsProcessed,
              documentsSkipped: result.documentsSkipped,
              chunksProcessed: result.chunksProcessed,
              vectorsStored: result.vectorsStored,
              embeddingTokens: result.embeddingTokens,
            },
          });
        } catch (error) {
          logger.error("Failed to process request from queue", {
            dataroomId: payload.dataroomId,
            processingId,
            request: nextRequest,
            error: getErrorMessage(error),
          });
          continue;
        }
      }

      logger.info("RAG indexing worker completed", {
        dataroomId: payload.dataroomId,
        processingId,
        totalDocumentsProcessed,
        totalDocumentsSkipped,
        totalChunksProcessed,
        totalVectorsStored,
        totalEmbeddingTokens,
      });

      return {
        success: true,
        documentsProcessed: totalDocumentsProcessed,
        documentsSkipped: totalDocumentsSkipped,
        chunksProcessed: totalChunksProcessed,
        vectorsStored: totalVectorsStored,
        processingId,
        embeddingTokens: totalEmbeddingTokens,
      };
    } catch (error) {
      logger.error("RAG indexing worker failed", {
        dataroomId: payload.dataroomId,
        processingId,
        error: getErrorMessage(error),
      });

      return {
        success: false,
        documentsProcessed: 0,
        documentsSkipped: 0,
        chunksProcessed: 0,
        vectorsStored: 0,
        error: getErrorMessage(error),
        processingId,
        embeddingTokens: 0,
      };
    } finally {
      try {
        await RAGQueueManager.releaseLock(payload.dataroomId);
        logger.info("Released lock and worker finished", {
          dataroomId: payload.dataroomId,
          processingId,
        });

        // Clean up Docling resources
        if (documentProcessor) {
          try {
            await documentProcessor.cleanupDoclingResources();
            logger.info("Successfully cleaned up Docling resources", {
              dataroomId: payload.dataroomId,
              processingId,
            });
          } catch (cleanupError) {
            logger.error("Failed to cleanup Docling resources", {
              dataroomId: payload.dataroomId,
              processingId,
              error: getErrorMessage(cleanupError),
            });
          }
        }
      } catch (error) {
        logger.error("Error in cleanup phase", {
          dataroomId: payload.dataroomId,
          processingId,
          error: getErrorMessage(error),
        });
      }
    }
  },
});

/**
 * Process a single RAG indexing request
 */
async function processRAGIndexingRequest(
  request: {
    dataroomId: string;
    teamId: string;
    userId: string;
  },
  processingId: string,
  documentProcessor: DocumentProcessor | null,
  embeddingGenerator: EmbeddingGenerator | null,
): Promise<{
  documentsProcessed: number;
  documentsSkipped: number;
  chunksProcessed: number;
  vectorsStored: number;
  embeddingTokens: number;
  documentProcessor: DocumentProcessor | null;
  embeddingGenerator: EmbeddingGenerator | null;
}> {
  // Initialize components if needed
  if (!documentProcessor) {
    documentProcessor = new DocumentProcessor();
  }
  if (!embeddingGenerator) {
    embeddingGenerator = new EmbeddingGenerator(
      "text-embedding-3-small",
      120,
      3000,
    );
  }

  // Check Dataroom RAG Status
  const ragStatus = await checkDataroomRAGStatus(request.dataroomId);

  logger.info("Processing RAG indexing request", {
    dataroomId: request.dataroomId,
    processingId,
    ragStatus: {
      totalDocuments: ragStatus.totalDocuments,
      indexedDocuments: ragStatus.indexedDocuments,
      allIndexed: ragStatus.allIndexed,
      needsIndexing: ragStatus.needsIndexing,
      unindexedCount: ragStatus.unindexedDocumentIds.length,
    },
  });

  // Early exit
  if (!ragStatus.needsIndexing) {
    logger.info("No indexing needed - all documents already indexed", {
      dataroomId: request.dataroomId,
      processingId,
    });

    return {
      documentsProcessed: 0,
      documentsSkipped: ragStatus.totalDocuments,
      chunksProcessed: 0,
      vectorsStored: 0,
      embeddingTokens: 0,
      documentProcessor,
      embeddingGenerator,
    };
  }

  // Check if any documents need processing
  if (ragStatus.unindexedDocumentIds.length === 0) {
    logger.info("No documents need processing", {
      dataroomId: request.dataroomId,
      processingId,
    });

    await updateDataroomIndexingStatus(request.dataroomId, {
      status: "COMPLETED",
      completedAt: new Date(),
      progress: 100.0,
    });

    return {
      documentsProcessed: 0,
      documentsSkipped: ragStatus.totalDocuments,
      chunksProcessed: 0,
      vectorsStored: 0,
      embeddingTokens: 0,
      documentProcessor,
      embeddingGenerator,
    };
  }

  // Process documents
  const documentsWithUrls = await getDocumentsForProcessing(
    ragStatus.unindexedDocumentIds,
    request.dataroomId,
  );

  const supportedDocuments = documentsWithUrls.filter((doc) =>
    isDocumentFormatSupported(doc.contentType, documentProcessor!),
  );

  logger.info("Document processing status", {
    dataroomId: request.dataroomId,
    processingId,
    totalDocuments: documentsWithUrls.length,
    supportedDocuments: supportedDocuments.length,
  });

  if (supportedDocuments.length > 0) {
    await prisma.document.updateMany({
      where: { id: { in: supportedDocuments.map((d) => d.id) } },
      data: {
        ragIndexingStatus: ParsingStatus.IN_PROGRESS,
        ragIndexingStartedAt: new Date(),
        ragIndexingProgress: 0.0,
      },
    });
  }

  // Process documents using the existing interface
  const processingResults = await documentProcessor!.processDocuments(
    supportedDocuments,
    request.dataroomId,
    request.teamId,
    DOCUMENT_PROCESSING_CONCURRENCY,
  );

  const allChunks: Array<{
    chunkId: string;
    content: string;
    metadata: DocumentProcessingResult["chunks"][number]["metadata"];
  }> = [];
  const successfulDocumentIds: string[] = [];
  const statusUpdates: Array<{
    documentId: string;
    status: ParsingStatus;
    error?: string;
  }> = [];

  for (const result of processingResults) {
    const documentId = result.chunks?.[0]?.metadata?.documentId;

    if (result.success && result.chunks) {
      for (const chunk of result.chunks) {
        allChunks.push({
          chunkId: chunk.id,
          content: chunk.content,
          metadata: chunk.metadata,
        });
      }
      if (documentId) {
        successfulDocumentIds.push(documentId);
        statusUpdates.push({
          documentId,
          status: ParsingStatus.COMPLETED,
        });
      }
    } else {
      if (documentId) {
        statusUpdates.push({
          documentId,
          status: ParsingStatus.FAILED,
          error: result.error || "Document processing failed",
        });
      }
    }
  }

  if (statusUpdates.length > 0) {
    await prisma.$transaction(
      statusUpdates.map((update) =>
        prisma.document.update({
          where: { id: update.documentId },
          data: {
            ragIndexingStatus: update.status,
            ragIndexingFinishedAt: new Date(),
            ragIndexingProgress:
              update.status === ParsingStatus.COMPLETED ? 100.0 : 0.0,
            ragIndexError: update.error || null,
          },
        }),
      ),
    );
  }

  let embeddingTokens = 0;

  logger.info("Chunks collected", {
    dataroomId: request.dataroomId,
    processingId,
    totalChunks: allChunks.length,
    embeddingTokens,
  });

  if (allChunks.length === 0) {
    logger.warn("No chunks generated from document processing", {
      dataroomId: request.dataroomId,
      processingId,
    });

    await updateDataroomIndexingStatus(request.dataroomId, {
      status: "COMPLETED",
      completedAt: new Date(),
      progress: 100.0,
    });

    return {
      documentsProcessed: processingResults.filter((r) => r.success).length,
      documentsSkipped: processingResults.filter((r) => !r.success).length,
      chunksProcessed: 0,
      vectorsStored: 0,
      embeddingTokens: 0,
      documentProcessor,
      embeddingGenerator,
    };
  }

  const embeddingBatches = allChunks.map((chunk) => ({
    chunkId: chunk.chunkId,
    content: chunk.content,
    metadata: chunk.metadata,
  }));

  const embeddingResult =
    await embeddingGenerator!.generateEmbeddings(embeddingBatches);

  if (!embeddingResult.success) {
    throw new Error(`Embedding generation failed: ${embeddingResult.error}`);
  }

  embeddingTokens = embeddingResult.totalTokens;

  logger.info("Embeddings generated", {
    dataroomId: request.dataroomId,
    processingId,
    embeddingCount: embeddingResult.embeddings.length,
    embeddingTokens,
    cachedCount: embeddingResult.cachedCount,
    newCount: embeddingResult.newCount,
  });

  // Store in vector database
  // Ensure collection exists
  const collectionExists = await vectorManager.collectionExists(
    request.dataroomId,
  );

  if (!collectionExists) {
    await vectorManager.createCollection(
      request.dataroomId,
      embeddingGenerator!.getEmbeddingDimensions(),
    );
    logger.info("Created Qdrant collection", {
      dataroomId: request.dataroomId,
    });
  }

  // Prepare points for Qdrant
  const qdrantPoints = embeddingResult.embeddings.map((embedding) => {
    const chunk = allChunks.find((c) => c.chunkId === embedding.chunkId);
    if (!chunk) {
      throw new Error(`Chunk not found for embedding: ${embedding.chunkId}`);
    }

    return {
      id: vectorManager.generatePointId(embedding.chunkId),
      vector: embedding.embedding,
      payload: {
        chunkId: embedding.chunkId,
        documentId: chunk.metadata.documentId,
        documentName: chunk.metadata.documentName,
        contentType: chunk.metadata.contentType,
        pageRanges: chunk.metadata.pageRanges,
        sectionHeader: chunk.metadata.sectionHeader,
        chunkIndex: Number(chunk.metadata.chunkIndex),
        dataroomId: request.dataroomId,
        teamId: request.teamId,
        content: chunk.content,
        tokenCount: chunk.metadata.tokenCount,
        createdAt: new Date().toISOString(),
      },
    };
  });

  const qdrantSuccess = await vectorManager.upsertPoints(
    request.dataroomId,
    qdrantPoints,
    VECTOR_UPSERT_CONCURRENCY,
  );
  if (!qdrantSuccess) {
    throw new Error("Failed to store vectors in Qdrant");
  }

  const vectorsStored = qdrantPoints.length;

  const documentTokenCounts = await calculateDocumentTokenCounts(
    allChunks,
    embeddingResult.embeddings,
  );

  const totalDocumentTokens = Array.from(documentTokenCounts.values()).reduce(
    (sum, count) => sum + count,
    0,
  );

  if (successfulDocumentIds.length > 0) {
    await markDocumentsAsIndexed(
      successfulDocumentIds,
      request.dataroomId,
      documentTokenCounts,
    );
  }

  await updateDataroomIndexingStatus(request.dataroomId, {
    status: "COMPLETED",
    completedAt: new Date(),
    progress: 100.0,
    embeddingTokens: totalDocumentTokens,
  });

  logger.info("Request processing completed", {
    dataroomId: request.dataroomId,
    processingId,
    documentsProcessed: processingResults.filter((r) => r.success).length,
    documentsSkipped: processingResults.filter((r) => !r.success).length,
    chunksProcessed: allChunks.length,
    vectorsStored,
  });

  return {
    documentsProcessed: processingResults.filter((r) => r.success).length,
    documentsSkipped: processingResults.filter((r) => !r.success).length,
    chunksProcessed: allChunks.length,
    vectorsStored,
    embeddingTokens: totalDocumentTokens,
    documentProcessor,
    embeddingGenerator,
  };
}

async function checkDataroomRAGStatus(
  dataroomId: string,
): Promise<DataroomRAGStatus> {
  const dataroom = await prisma.dataroom.findUnique({
    where: { id: dataroomId },
    include: {
      documents: {
        include: {
          document: {
            select: {
              id: true,
              ragIndexingStatus: true,
              ragIndexingStartedAt: true,
              ragIndexingProgress: true,
            },
          },
        },
      },
    },
  });

  if (!dataroom) {
    throw new Error(`Dataroom not found: ${dataroomId}`);
  }

  const { totalDocuments, indexedDocuments, unindexedDocumentIds } =
    dataroom.documents.reduce(
      (acc, { document }) => {
        acc.totalDocuments++;
        if (document.ragIndexingStatus === ParsingStatus.COMPLETED) {
          acc.indexedDocuments++;
        } else {
          acc.unindexedDocumentIds.push(document.id);
        }
        return acc;
      },
      {
        totalDocuments: 0,
        indexedDocuments: 0,
        unindexedDocumentIds: [] as string[],
      },
    );

  return {
    totalDocuments,
    indexedDocuments,
    allIndexed: totalDocuments === indexedDocuments,
    needsIndexing: totalDocuments > 0 && indexedDocuments < totalDocuments,
    unindexedDocumentIds,
  };
}

async function updateDataroomIndexingStatus(
  dataroomId: string,
  updates: {
    status?: ParsingStatus;
    startedAt?: Date;
    completedAt?: Date;
    progress?: number;
    error?: string;
    embeddingTokens?: number;
    processingTokens?: number;
  },
): Promise<void> {
  await prisma.dataroomRAGSettings.upsert({
    where: { dataroomId },
    create: {
      dataroomId,
      enabled: true,
      ragIndexingStatus: updates.status || "NOT_STARTED",
      indexingStartedAt: updates.startedAt,
      indexingCompletedAt: updates.completedAt,
      indexingProgress: updates.progress || 0.0,
      indexingError: updates.error,
      totalEmbeddingTokens: updates.embeddingTokens || 0,
      totalProcessingTokens: updates.processingTokens || 0,
    },
    update: {
      ragIndexingStatus: updates.status,
      indexingStartedAt: updates.startedAt,
      indexingCompletedAt: updates.completedAt,
      indexingProgress: updates.progress,
      indexingError: updates.error,
      ...(updates.embeddingTokens !== undefined && {
        totalEmbeddingTokens: { increment: updates.embeddingTokens },
      }),
      ...(updates.processingTokens !== undefined && {
        totalProcessingTokens: { increment: updates.processingTokens },
      }),
    },
  });
}

function isDocumentFormatSupported(
  contentType: string,
  documentProcessor: DocumentProcessor,
): boolean {
  const supported = documentProcessor
    .getSupportedFormats()
    .map((s) => s.toLowerCase());
  const format = (contentType || "").toLowerCase();

  return supported.some(
    (s) =>
      format.includes(s) ||
      // Markdown variations
      (s === "md" &&
        (format.includes("markdown") || format.includes("text/markdown"))) ||
      // Word document variations
      (s === "docx" &&
        (format.includes("word") ||
          format.includes(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ))) ||
      (s === "doc" &&
        (format.includes("msword") || format.includes("application/msword"))) ||
      // PowerPoint variations
      (s === "pptx" &&
        (format.includes("powerpoint") ||
          format.includes(
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          ))) ||
      (s === "ppt" &&
        (format.includes("powerpoint") ||
          format.includes("application/vnd.ms-powerpoint"))) ||
      // Excel variations
      (s === "xlsx" &&
        (format.includes("excel") ||
          format.includes("spreadsheet") ||
          format.includes(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          ))) ||
      (s === "xls" &&
        (format.includes("excel") ||
          format.includes("spreadsheet") ||
          format.includes("application/vnd.ms-excel"))) ||
      // PDF variations
      (s === "pdf" &&
        (format.includes("pdf") || format.includes("application/pdf"))) ||
      // Text variations
      (s === "txt" &&
        (format.includes("text") || format.includes("text/plain"))) ||
      // HTML variations
      (s === "html" &&
        (format.includes("html") || format.includes("text/html"))) ||
      (s === "rtf" &&
        (format.includes("rtf") ||
          format.includes("application/rtf") ||
          format.includes("text/rtf"))) ||
      (s === "csv" &&
        (format.includes("csv") ||
          format.includes("text/csv") ||
          format.includes("comma-separated"))) ||
      (s === "json" &&
        (format.includes("json") || format.includes("application/json"))) ||
      (s === "xml" &&
        (format.includes("xml") ||
          format.includes("text/xml") ||
          format.includes("application/xml"))),
  );
}

async function getDocumentsForProcessing(
  documentIds: string[],
  dataroomId: string,
) {
  const documents = await prisma.dataroomDocument.findMany({
    where: {
      documentId: { in: documentIds },
      dataroomId,
    },
    include: {
      document: {
        select: {
          id: true,
          file: true,
          type: true,
          name: true,
        },
      },
    },
  });
  const limit = pLimit(PRESIGNED_URL_CONCURRENCY);

  const documentsWithUrls = await Promise.all(
    documents.map((doc) =>
      limit(async () => {
        try {
          const response = await fetch(
            `${process.env.NEXTAUTH_URL}/api/file/s3/get-presigned-get-url`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
              },
              body: JSON.stringify({ key: doc.document.file }),
            },
          );

          const { url } = await response.json();
          return {
            url,
            id: doc.document.id,
            contentType: doc.document.type || "document",
            name: doc.document.name,
          };
        } catch (error) {
          logger.error("Failed to get presigned URL", {
            documentId: doc.document.id,
            error: getErrorMessage(error),
          });
          return {
            url: doc.document.file,
            id: doc.document.id,
            contentType: doc.document.type || "document",
            name: doc.document.name,
          };
        }
      }),
    ),
  );

  return documentsWithUrls.filter(Boolean);
}

async function calculateDocumentTokenCounts(
  allChunks: Array<{ chunkId: string; content: string; metadata: any }>,
  embeddings: Array<{ chunkId: string; embedding: number[]; tokens?: number }>,
): Promise<Map<string, number>> {
  const documentTokenCounts = new Map<string, number>();

  const chunkTokenMap = new Map(
    embeddings.map((e) => [e.chunkId, e.tokens || 0]),
  );

  for (const chunk of allChunks) {
    const documentId = chunk.metadata.documentId;
    const tokens =
      chunkTokenMap.get(chunk.chunkId) || chunk.metadata.tokenCount || 0;
    documentTokenCounts.set(
      documentId,
      (documentTokenCounts.get(documentId) || 0) + tokens,
    );
  }

  return documentTokenCounts;
}

async function markDocumentsAsIndexed(
  documentIds: string[],
  dataroomId: string,
  documentTokenCounts: Map<string, number>,
) {
  if (documentIds.length === 0) return;

  const updates = documentIds.map((documentId) => ({
    id: documentId,
    tokenCount: documentTokenCounts.get(documentId) || 0,
  }));

  // Use transaction for atomicity
  await prisma.$transaction(
    updates.map(({ id, tokenCount }) =>
      prisma.document.update({
        where: { id },
        data: {
          ragIndexingStatus: ParsingStatus.COMPLETED,
          ragIndexingProgress: 100.0,
          embeddingTokenCount: tokenCount,
        },
      }),
    ),
  );

  logger.info("Successfully updated document statuses", {
    dataroomId,
    totalDocuments: documentIds.length,
  });
}
