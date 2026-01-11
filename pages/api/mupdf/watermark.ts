import { NextApiRequest, NextApiResponse } from "next";

import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

import { getFile } from "@/lib/files/get-file";
import prisma from "@/lib/prisma";
import { WatermarkConfig } from "@/lib/types";
import { log } from "@/lib/utils";
import {
  calculateBatchSize,
  getFileNameWithExtension,
  getFormatFromFilePath,
  getWatermarkedContentType,
  validateUrl,
  validateWatermarkRequest,
} from "@/lib/watermark/helpers";
import {
  Dimensions,
  ViewerData,
  generateSvgWatermark,
} from "@/lib/watermark/svg-generator";

// This function can run for a maximum of 300 seconds
export const config = {
  maxDuration: 300,
};

/**
 * Watermark a single image using sharp
 * Burns the watermark directly into the pixel data
 */
async function watermarkImage(
  imageBuffer: Buffer,
  watermarkConfig: WatermarkConfig,
  viewerData: ViewerData,
  outputFormat: "png" | "jpeg" = "png",
): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Could not determine image dimensions");
  }

  const dimensions: Dimensions = {
    width: metadata.width,
    height: metadata.height,
  };

  // Generate SVG watermark at image dimensions
  const svgWatermark = generateSvgWatermark(
    watermarkConfig,
    viewerData,
    dimensions,
  );

  // Composite watermark onto image (burned into pixels)
  const result = await image
    .composite([{ input: Buffer.from(svgWatermark), top: 0, left: 0 }])
    .toFormat(outputFormat, {
      quality: outputFormat === "jpeg" ? 90 : undefined,
    })
    .toBuffer();

  return result;
}

/**
 * Process a PDF by watermarking each page image and assembling into a flattened PDF
 */
async function watermarkPdf(
  documentVersionId: string,
  numPages: number,
  watermarkConfig: WatermarkConfig,
  viewerData: ViewerData,
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const DPI = 150; // Standard DPI for image to PDF conversion

  // Fetch all DocumentPage records for this version
  const pages = await prisma.documentPage.findMany({
    where: { versionId: documentVersionId },
    orderBy: { pageNumber: "asc" },
    select: { file: true, storageType: true, pageNumber: true },
  });

  if (pages.length === 0) {
    throw new Error("No pages found for document version");
  }

  // Limit pages to requested numPages
  const pagesToProcess = pages.slice(0, numPages);
  const BATCH_SIZE = calculateBatchSize(pagesToProcess.length);

  console.log(
    `Processing ${pagesToProcess.length} pages in batches of ${BATCH_SIZE}`,
  );

  // Process in batches for memory management
  for (let i = 0; i < pagesToProcess.length; i += BATCH_SIZE) {
    const batch = pagesToProcess.slice(i, i + BATCH_SIZE);

    const results = await Promise.all(
      batch.map(async (page) => {
        const url = await getFile({ type: page.storageType, data: page.file });
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch page ${page.pageNumber}: ${response.status}`,
          );
        }

        const buffer = Buffer.from(await response.arrayBuffer());

        // Detect original format from file path
        const originalFormat = getFormatFromFilePath(page.file);

        // Always output as PNG for consistency in PDF embedding
        const watermarkedBuffer = await watermarkImage(
          buffer,
          watermarkConfig,
          viewerData,
          "png",
        );

        return {
          buffer: watermarkedBuffer,
          originalFormat,
          pageNumber: page.pageNumber,
        };
      }),
    );

    // Add each watermarked image as a PDF page
    for (const { buffer: imageBuffer } of results) {
      const image = await pdfDoc.embedPng(imageBuffer);
      const { width, height } = image;

      // Convert pixel dimensions to PDF points (72 points per inch)
      const pageWidth = (width / DPI) * 72;
      const pageHeight = (height / DPI) * 72;

      const pdfPage = pdfDoc.addPage([pageWidth, pageHeight]);
      pdfPage.drawImage(image, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
      });
    }

    const progress = (((i + batch.length) / pagesToProcess.length) * 100).toFixed(1);
    console.log(
      `Processed pages ${i + 1}-${i + batch.length} of ${pagesToProcess.length} (${progress}%)`,
    );
  }

  return Buffer.from(await pdfDoc.save());
}

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  // Extract the API Key from the Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  // Check if the API Key matches
  if (token !== process.env.INTERNAL_API_KEY) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const startTime = Date.now();

  try {
    // Validate request body
    const requestBody = validateWatermarkRequest(req.body);
    const {
      url,
      outputFormat = "png",
      documentVersionId,
      numPages,
      watermarkConfig,
      viewerData,
      originalFileName,
    } = requestBody;

    // Determine if this is an image or PDF request
    const isImageRequest = !!url;

    if (isImageRequest) {
      // === SINGLE IMAGE WATERMARKING ===

      // Validate URL to prevent SSRF attacks
      let validatedUrl: URL;
      try {
        validatedUrl = validateUrl(url!);
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : String(error);
        log({
          message: `URL validation failed: ${errorMsg}\nAttempted URL: ${url}`,
          type: "error",
          mention: false,
        });
        return res.status(400).json({
          error: "Invalid URL",
          details: errorMsg,
        });
      }

      // Fetch the image
      const fetchStart = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      let response: Response;
      try {
        response = await fetch(validatedUrl.toString(), {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        const errorMsg =
          error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to fetch image: ${errorMsg}`);
      }

      console.log(`Image fetch took ${Date.now() - fetchStart}ms`);

      const imageBuffer = Buffer.from(await response.arrayBuffer());

      // Watermark the image
      const watermarkStart = Date.now();
      const watermarkedBuffer = await watermarkImage(
        imageBuffer,
        watermarkConfig,
        viewerData,
        outputFormat,
      );
      console.log(`Image watermarking took ${Date.now() - watermarkStart}ms`);

      // Set appropriate headers
      res.setHeader("Content-Type", getWatermarkedContentType(outputFormat));
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(getFileNameWithExtension(originalFileName, outputFormat))}"`,
      );
      res.setHeader("Content-Length", watermarkedBuffer.length);

      console.log(
        `Total image processing time: ${Date.now() - startTime}ms`,
      );

      return res.status(200).send(watermarkedBuffer);
    } else {
      // === PDF WATERMARKING (via page images) ===

      if (!documentVersionId || !numPages) {
        return res.status(400).json({
          error: "Missing required fields",
          details: "documentVersionId and numPages are required for PDF watermarking",
        });
      }

      console.log(
        `Starting PDF watermarking for version ${documentVersionId} with ${numPages} pages`,
      );

      const pdfBuffer = await watermarkPdf(
        documentVersionId,
        numPages,
        watermarkConfig,
        viewerData,
      );

      const finalSizeMB = pdfBuffer.length / 1024 / 1024;
      console.log(
        `Total PDF processing time: ${Date.now() - startTime}ms, final size: ${finalSizeMB.toFixed(2)}MB`,
      );

      // Set appropriate headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(getFileNameWithExtension(originalFileName, "pdf"))}"`,
      );
      res.setHeader("Content-Length", pdfBuffer.length);

      return res.status(200).send(pdfBuffer);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    const elapsedTime = Date.now() - startTime;

    // Determine appropriate status code based on error type
    let statusCode = 500;
    let errorType = "Failed to apply watermark";

    if (errorMessage.includes("Timeout") || errorMessage.includes("timeout")) {
      statusCode = 504;
      errorType = "Request timeout";
    } else if (
      errorMessage.includes("too large") ||
      errorMessage.includes("Maximum")
    ) {
      statusCode = 413;
      errorType = "Document too large";
    } else if (
      errorMessage.includes("fetch") ||
      errorMessage.includes("HTTP")
    ) {
      statusCode = 502;
      errorType = "Failed to fetch document";
    } else if (errorMessage.includes("No pages found")) {
      statusCode = 404;
      errorType = "Document pages not found";
    } else if (
      errorMessage.includes("Invalid") ||
      errorMessage.includes("Missing")
    ) {
      statusCode = 400;
      errorType = "Invalid request";
    }

    log({
      message: `${errorType} after ${elapsedTime}ms: ${errorMessage}\n\nDocument: ${req.body?.originalFileName || "unknown"}`,
      type: "error",
      mention: elapsedTime > 120000,
    });

    return res.status(statusCode).json({
      error: errorType,
      details: errorMessage,
      processingTime: elapsedTime,
    });
  }
}
