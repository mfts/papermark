import { logger } from "@trigger.dev/sdk/v3";
import pMap from "p-map";

import { EnhancedDocumentChunker } from "./enhanced-chunking-strategy";
import { RAGError, getErrorMessage } from "./errors";
import { InputFormat, getProcessingConfig } from "./file-format-detector";
import { saveChunksToDB, saveMarkdownToDB } from "./markdown-storage";
import {
  calculatePollInterval,
  calculateTimeout,
  makeApiCall,
} from "./utils/api-utils";

// Types for document processing
export interface DocumentProcessingResult {
  success: boolean;
  chunks: DocumentChunk[];
  error?: string;
  processingTime: number;
}

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    chunkIndex: number;
    documentId: string;
    documentName: string;
    dataroomId: string;
    teamId: string;
    contentType: string;
    pageRanges?: string[];
    tokenCount?: number;
    sectionHeader?: string;
  };
  chunkHash: string;
}

export interface DoclingJobStatus {
  task_id: string;
  task_status: string;
  task_position?: number;
  task_meta?: {
    num_docs: number;
    num_processed: number;
    num_succeeded: number;
    num_failed: number;
  };
}

// Production configuration
export interface DoclingConfig {
  baseUrl: string;
  maxRetries: number;
  timeout: number;
  supportedFormats: string[];
}

// Docling API integration
export class DoclingProcessor {
  private config: DoclingConfig;

  constructor(config?: Partial<DoclingConfig>) {
    // Validate and sanitize configuration
    const baseUrl = config?.baseUrl || process.env.DOCLING_API_URL || "";

    // Validate base URL format
    if (!/^https?:\/\/.+/.test(baseUrl)) {
      throw RAGError.create(
        "validation",
        `Invalid Docling base URL: ${baseUrl}`,
        { field: "baseUrl" },
      );
    }

    this.config = {
      baseUrl,
      maxRetries: Math.max(1, Math.min(10, config?.maxRetries || 3)),
      timeout: Math.max(30000, Math.min(600000, config?.timeout || 300000)),
      supportedFormats: config?.supportedFormats || [
        "pdf",
        "docx",
        "pptx",
        "html",
        "image",
        "md",
        "csv",
      ],
      ...config,
    };

    // Validate supported formats
    if (
      !Array.isArray(this.config.supportedFormats) ||
      this.config.supportedFormats.length === 0
    ) {
      throw RAGError.create(
        "validation",
        "Supported formats must be a non-empty array",
        { field: "supportedFormats" },
      );
    }
  }

  public getFormatFromContentType(contentType: string): InputFormat {
    const lower = contentType.toLowerCase();
    if (lower.includes("pdf")) return InputFormat.PDF;
    if (lower.includes("docx") || lower.includes("word"))
      return InputFormat.DOCX;
    if (lower.includes("pptx") || lower.includes("powerpoint"))
      return InputFormat.PPTX;
    if (lower.includes("html")) return InputFormat.HTML;
    if (lower.includes("markdown") || lower.includes("md"))
      return InputFormat.MD;
    if (lower.includes("asciidoc")) return InputFormat.ASCIIDOC;
    if (lower.includes("csv")) return InputFormat.CSV;
    if (
      lower.includes("image") ||
      lower.includes("jpg") ||
      lower.includes("png")
    )
      return InputFormat.IMAGE;
    return InputFormat.PDF;
  }

  public getSupportedFormats(): string[] {
    return [...this.config.supportedFormats];
  }

  // finalized
  public async submitDocumentForProcessing(
    documentUrl: string,
    contentType?: string,
  ): Promise<string> {
    // Input validation
    if (!documentUrl || typeof documentUrl !== "string") {
      throw RAGError.create(
        "validation",
        "Document URL is required and must be a string",
        { field: "documentUrl" },
      );
    }

    if (documentUrl.length > 2048) {
      throw RAGError.create(
        "validation",
        "Document URL is too long (max 2048 characters)",
        { field: "documentUrl" },
      );
    }

    // Sanitize content type
    const sanitizedContentType = contentType
      ? contentType.toLowerCase().trim().substring(0, 100)
      : "document";

    const format = this.getFormatFromContentType(sanitizedContentType);
    const config = getProcessingConfig(format);

    const requestBody = {
      sources: [{ kind: "http", url: documentUrl }],
      options: {
        to_formats: ["md"],
        image_export_mode: "embedded",
        do_ocr: config.requiresOcr,
        force_ocr: config.requiresOcr,
        ocr_engine: "easyocr", // tesserocr
        pdf_backend: "dlparse_v4",
        table_mode: "accurate",
        pipeline: "standard",
        document_timeout: 1400.0,
        abort_on_error: false,
        do_table_structure: true,
        include_images: true,
        images_scale: 2.0,
        md_page_break_placeholder: "---PAGE_BREAK---",
        do_code_enrichment: false,
        do_formula_enrichment: false,
        do_picture_classification: false,
        do_picture_description: false,
        picture_description_area_threshold: 0.05,
      },
    };
    const response = await makeApiCall<{
      task_id: string;
      task_status: string;
    }>(
      `${this.config.baseUrl}/v1/convert/source/async`,
      {
        method: "POST",
        body: requestBody,
        timeout: this.config.timeout,
      },
      { url: documentUrl, contentType: sanitizedContentType },
    );

    if (!response.success || !response.data?.task_id) {
      logger.error("Docling API submission failed", {
        url: documentUrl,
        contentType: sanitizedContentType,
        error: response.error,
        status: response.status,
      });
      throw RAGError.create(
        "documentProcessing",
        response.error || "No task_id received",
        { documentUrl },
      );
    }

    return response.data.task_id;
  }

  public async pollJobStatus(
    taskId: string,
    maxAttempts: number = 30,
    documentCount: number = 1,
  ): Promise<DoclingJobStatus> {
    const startTime = Date.now();

    // Use utility functions for timeout and polling calculations
    const calculatedTimeout = calculateTimeout(documentCount);
    const pollInterval = calculatePollInterval(documentCount);

    logger.info("Dynamic timeout configuration", {
      taskId,
      documentCount,
      calculatedTimeout: Math.round(calculatedTimeout / 1000),
      pollInterval: Math.round(pollInterval / 1000),
      maxAttempts,
    });

    for (let i = 0; i < maxAttempts; i++) {
      try {
        // Check timeout
        if (Date.now() - startTime > calculatedTimeout) {
          logger.error("Polling timeout reached", {
            taskId,
            calculatedTimeout: Math.round(calculatedTimeout / 1000),
            attempts: i + 1,
            documentCount,
          });
          throw RAGError.create("timeout", undefined, {
            operation: "polling",
            duration: Math.round(calculatedTimeout / 1000),
          });
        }

        const response = await makeApiCall<{
          task_id: string;
          task_status: string;
          task_position?: number;
          task_meta?: {
            num_docs: number;
            num_processed: number;
            num_succeeded: number;
            num_failed: number;
          };
        }>(
          `${this.config.baseUrl}/v1/status/poll/${taskId}`,
          {
            timeout: Math.min(calculatedTimeout, 60000),
          },
          { taskId, attempt: i + 1 },
        );

        if (!response.success) {
          throw RAGError.create(
            "documentProcessing",
            `Polling failed: ${response.error}`,
            { taskId },
          );
        }

        const status = response.data!;
        logger.debug("Polling status received", {
          taskId,
          status: status.task_status,
          attempt: i + 1,
        });

        // Handle successful completion
        if (
          status.task_status === "success" ||
          status.task_status === "partial_success"
        ) {
          logger.info("Job completed successfully", {
            taskId,
            attempt: i + 1,
            status: status.task_status,
          });
          return status;
        }

        // Handle failure states
        if (
          status.task_status === "failed" ||
          status.task_status === "failure" ||
          status.task_status === "skipped"
        ) {
          logger.error("Docling job failed", {
            taskId,
            status: status.task_status,
            taskMeta: status.task_meta,
          });
          throw RAGError.create(
            "documentProcessing",
            `Docling job failed with status '${status.task_status}'`,
            { taskId },
          );
        }

        // Handle processing states
        if (
          status.task_status === "pending" ||
          status.task_status === "started"
        ) {
          logger.debug("Job still processing", {
            taskId,
            attempt: i + 1,
            status: status.task_status,
          });
        }

        // Dynamic polling interval with jitter
        const jitter = Math.random() * 2000; // 0-2 seconds
        const delay = pollInterval + jitter;

        logger.debug("Job still processing, waiting", {
          taskId,
          attempt: i + 1,
          status: status.task_status,
          delay: Math.round(delay / 1000),
          pollInterval: Math.round(pollInterval / 1000),
        });

        await new Promise((r) => setTimeout(r, delay));
      } catch (error) {
        logger.warn("Polling attempt failed", {
          taskId,
          attempt: i + 1,
          error: error instanceof Error ? error.message : String(error),
        });

        // If it's the last attempt, throw the error
        if (i === maxAttempts - 1) {
          throw error;
        }

        // Wait before retry
        await new Promise((r) => setTimeout(r, 5000));
      }
    }

    throw RAGError.create("timeout", undefined, {
      operation: "jobPolling",
      maxAttempts,
    });
  }

  public async processDocument(
    documentUrl: string,
    contentType?: string,
    documentCount: number = 1,
  ): Promise<string> {
    const startTime = Date.now();

    try {
      // Validate URL format
      if (!/^https?:\/\//.test(documentUrl)) {
        throw RAGError.create(
          "validation",
          `Invalid URL format: ${documentUrl}`,
          { field: "documentUrl" },
        );
      }

      logger.info("Starting Docling document processing", {
        url: documentUrl,
        contentType,
        baseUrl: this.config.baseUrl,
      });

      // Submit for processing
      const taskId = await this.submitDocumentForProcessing(
        documentUrl,
        contentType,
      );
      logger.info("Document submitted for processing", {
        taskId,
        url: documentUrl,
        contentType,
        documentId: documentUrl.split("/").pop(), // Extract filename for debugging
      });

      // Poll for completion with dynamic timeout
      await this.pollJobStatus(taskId, 30, documentCount);
      logger.info("Document processing completed", {
        taskId,
        url: documentUrl,
      });

      // Fetch result using API utility
      const response = await makeApiCall<{
        document: {
          filename: string;
          md_content?: string;
          metadata?: any[];
        };
        status: string;
        processing_time: number;
      }>(
        `${this.config.baseUrl}/v1/result/${taskId}`,
        {
          timeout: this.config.timeout,
        },
        { taskId, url: documentUrl },
      );

      if (!response.success) {
        throw RAGError.create(
          "documentProcessing",
          `Failed to fetch result: ${response.error}`,
          { taskId },
        );
      }

      const result = response.data!;

      if (!result.document?.md_content) {
        throw RAGError.create(
          "documentProcessing",
          "No markdown content extracted from document",
          { taskId },
        );
      }
      const metadata = result.document.metadata || [];
      logger.info("Received metadata structure from Docling", {
        metadataCount: metadata.length,
        firstBlock: metadata[0] || "No metadata blocks found",
        result,
      });

      const processingTime = Date.now() - startTime;
      logger.info("Docling document processing successful", {
        taskId,
        url: documentUrl,
        contentLength: result.document.md_content.length,
        processingTime,
      });

      return result.document.md_content;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error("Docling document processing failed", {
        url: documentUrl,
        contentType,
        error: error instanceof Error ? error.message : String(error),
        processingTime,
      });
      throw error;
    }
  }

  public getBaseUrl(): string {
    return this.config.baseUrl;
  }
}

export class DocumentProcessor {
  private docling: DoclingProcessor;
  private enhancedChunker: EnhancedDocumentChunker;

  constructor(config?: Partial<DoclingConfig>) {
    this.docling = new DoclingProcessor(config);
    this.enhancedChunker = new EnhancedDocumentChunker();
  }

  public async processDocument(
    name: string,
    url: string,
    id: string,
    dataroomId: string,
    teamId: string,
    contentType: string = "document",
    documentCount: number = 1,
  ): Promise<DocumentProcessingResult> {
    const start = Date.now();
    const metrics = {
      doclingTime: 0,
      chunkingTime: 0,
      totalTime: 0,
      chunkCount: 0,
      contentLength: 0,
    };

    try {
      const doclingStart = Date.now();
      const md = await this.docling.processDocument(
        url,
        contentType,
        documentCount,
      );
      metrics.doclingTime = Date.now() - doclingStart;
      metrics.contentLength = md.length;

      const chunkingStart = Date.now();
      const enhancedChunks = await this.enhancedChunker.createEnhancedChunks(
        md,
        id,
        name,
        dataroomId,
        teamId,
        contentType,
      );

      logger.log("enhancedChunks", {
        enhancedChunks: enhancedChunks.slice(0, 3),
      });

      const chunks = enhancedChunks.map((chunk) => ({
        id: chunk.id,
        content: chunk.content,
        metadata: {
          chunkIndex: chunk.metadata.chunkIndex,
          documentId: chunk.metadata.documentId,
          documentName: chunk.metadata.documentName,
          dataroomId: chunk.metadata.dataroomId,
          teamId: chunk.metadata.teamId,
          contentType: chunk.metadata.contentType,
          pageRanges: chunk.metadata.pageRanges,
          tokenCount: chunk.metadata.tokenCount,
          sectionHeader: chunk.metadata.sectionHeader,
          headerHierarchy: chunk.metadata.headerHierarchy,
          isSmallChunk: chunk.metadata.isSmallChunk,
        },
        chunkHash: chunk.chunkHash,
      }));
      metrics.chunkingTime = Date.now() - chunkingStart;

      logger.log("chunks", { chunks: chunks.slice(0, 3) });

      logger.info("Chunks created successfully", {
        documentId: id,
        chunkCount: enhancedChunks.length,
        avgChunkSize: Math.round(metrics.contentLength / enhancedChunks.length),
        sampleChunkIds: enhancedChunks.slice(0, 3).map((chunk) => chunk.id),
      });
      const dbSaveStart = Date.now();
      await Promise.all([
        saveMarkdownToDB(
          id,
          md,
          teamId,
          metrics.doclingTime,
          metrics.chunkingTime,
        ),
        saveChunksToDB(
          id,
          enhancedChunks.map((chunk) => ({
            id: chunk.id,
            content: chunk.content,
            chunkIndex: chunk.metadata.chunkIndex,
            chunkHash: chunk.chunkHash,
            dataroomId: chunk.metadata.dataroomId,
            teamId: chunk.metadata.teamId,
            contentType: chunk.metadata.contentType,
            pageRanges: chunk.metadata.pageRanges?.join(", "),
            tokenCount: chunk.metadata.tokenCount,
            sectionHeader: chunk.metadata.sectionHeader,
            headerHierarchy: chunk.metadata.headerHierarchy
              ? JSON.stringify(chunk.metadata.headerHierarchy)
              : undefined,
            isSmallChunk: chunk.metadata.isSmallChunk,
          })),
        ),
      ]);
      const dbSaveTime = Date.now() - dbSaveStart;

      metrics.chunkCount = chunks.length;

      metrics.totalTime = Date.now() - start;

      logger.info("Document processing successful", {
        documentId: id,
        chunkCount: metrics.chunkCount,
        totalTime: metrics.totalTime,
        doclingTime: metrics.doclingTime,
        chunkingTime: metrics.chunkingTime,
        dbSaveTime: dbSaveTime,
        avgChunkSize: Math.round(metrics.contentLength / metrics.chunkCount),
      });

      return {
        success: true,
        chunks,
        processingTime: metrics.totalTime,
      };
    } catch (err: any) {
      metrics.totalTime = Date.now() - start;

      logger.error("Document processing failed", {
        documentId: id,
        dataroomId,
        teamId,
        error: getErrorMessage(err),
        totalTime: metrics.totalTime,
        metrics,
      });

      return {
        success: false,
        chunks: [],
        error: getErrorMessage(err),
        processingTime: metrics.totalTime,
      };
    }
  }

  public async processDocuments(
    docs: Array<{
      url: string;
      id: string;
      contentType?: string;
      name?: string;
    }>,
    dataroomId: string,
    teamId: string,
    maxConcurrency: number = 3,
  ): Promise<DocumentProcessingResult[]> {
    const startTime = Date.now();

    try {
      // Validate inputs
      if (!Array.isArray(docs) || docs.length === 0) {
        logger.warn("No documents to process", { dataroomId, teamId });
        return [];
      }

      if (maxConcurrency < 1 || maxConcurrency > 10) {
        maxConcurrency = 3; // Default to safe concurrency level
        logger.warn("Invalid concurrency level, using default", {
          maxConcurrency,
        });
      }

      logger.info("Starting batch document processing", {
        dataroomId,
        teamId,
        documentCount: docs.length,
        maxConcurrency,
        estimatedTime: Math.ceil(docs.length / maxConcurrency) * 30, // Rough estimate
      });

      const results = await pMap(
        docs,
        async (doc, index) => {
          const docStartTime = Date.now();

          try {
            logger.debug("Processing individual document", {
              index: index + 1,
              total: docs.length,
              documentId: doc.id,
              url: doc.url,
            });

            const result = await this.processDocument(
              doc.name || "Unknown Document",
              doc.url,
              doc.id,
              dataroomId,
              teamId,
              doc.contentType,
              docs.length,
            );

            const docProcessingTime = Date.now() - docStartTime;
            logger.debug("Individual document processed successfully", {
              index: index + 1,
              documentId: doc.id,
              processingTime: docProcessingTime,
              chunkCount: result.chunks?.length || 0,
            });

            return result;
          } catch (error) {
            const docProcessingTime = Date.now() - docStartTime;
            logger.error("Individual document processing failed", {
              index: index + 1,
              documentId: doc.id,
              url: doc.url,
              processingTime: docProcessingTime,
              error: error instanceof Error ? error.message : String(error),
            });

            // Return error result instead of throwing to continue processing other docs
            return {
              success: false,
              chunks: [],
              error: error instanceof Error ? error.message : String(error),
              processingTime: docProcessingTime,
            };
          }
        },
        {
          concurrency: maxConcurrency,
          stopOnError: false,
        },
      );

      const totalProcessingTime = Date.now() - startTime;
      const successfulResults = results.filter((r) => r.success);
      const failedResults = results.filter((r) => !r.success);

      logger.info("Batch document processing completed", {
        dataroomId,
        teamId,
        totalDocuments: docs.length,
        successfulDocuments: successfulResults.length,
        failedDocuments: failedResults.length,
        totalProcessingTime,
        averageTimePerDocument: Math.round(totalProcessingTime / docs.length),
      });

      return results;
    } catch (error) {
      const totalProcessingTime = Date.now() - startTime;
      logger.error("Batch document processing failed", {
        dataroomId,
        teamId,
        documentCount: docs.length,
        processingTime: totalProcessingTime,
        error: error instanceof Error ? error.message : String(error),
      });

      // Return error results for all documents
      return docs.map((doc) => ({
        success: false,
        chunks: [],
        error: error instanceof Error ? error.message : String(error),
        processingTime: totalProcessingTime,
      }));
    }
  }

  /**
   * Get supported formats from docling processor
   */
  public getSupportedFormats(): string[] {
    return this.docling.getSupportedFormats();
  }

  /**
   * Clean up Docling resources after processing
   */
  public async cleanupDoclingResources(): Promise<void> {
    try {
      logger.info("Cleaning up Docling resources");

      // Use the docling processor to get the base URL
      const baseUrl = this.docling.getBaseUrl();

      // Clear converters using API utility
      const convertersResponse = await makeApiCall(
        `${baseUrl}/v1/clear/converters`,
        { method: "GET" },
        { operation: "clear_converters" },
      );

      if (convertersResponse.success) {
        logger.info("Cleared Docling converters", {
          result: convertersResponse.data,
        });
      } else {
        logger.warn("Failed to clear Docling converters", {
          error: convertersResponse.error,
        });
      }

      // Clear results (older than 1 hour) using API utility
      const resultsResponse = await makeApiCall(
        `${baseUrl}/v1/clear/results?older_then=3600`,
        { method: "GET" },
        { operation: "clear_results" },
      );

      if (resultsResponse.success) {
        logger.info("Cleared Docling results", {
          result: resultsResponse.data,
        });
      } else {
        logger.warn("Failed to clear Docling results", {
          error: resultsResponse.error,
        });
      }
    } catch (error) {
      logger.error("Error cleaning up Docling resources", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
