import { NextApiRequest, NextApiResponse } from "next";

import { DocumentPage } from "@prisma/client";
import { get } from "@vercel/edge-config";
import { waitUntil } from "@vercel/functions";
import * as mupdf from "mupdf";

import { putFileServer } from "@/lib/files/put-file-server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";

// This function can run for a maximum of 120 seconds
export const config = {
  maxDuration: 180,
};

const MAX_PDF_SIZE_MB = 500;
const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024;

function isWasmMemoryError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("memory access out of bounds") ||
    message.includes("out of memory") ||
    message.includes("malloc") ||
    message.includes("Cannot enlarge memory arrays") ||
    message.includes("OOM")
  );
}

function destroySafe(obj: { destroy: () => void } | null | undefined): void {
  if (obj) {
    try {
      obj.destroy();
    } catch (e) {
      console.error("Error during mupdf object cleanup:", e);
    }
  }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (token !== process.env.INTERNAL_API_KEY) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { documentVersionId, pageNumber, url, teamId } = req.body as {
    documentVersionId: string;
    pageNumber: number;
    url: string;
    teamId: string;
  };

  let doc: mupdf.PDFDocument | null = null;
  let page: mupdf.Page | null = null;
  let scaledPixmap: mupdf.Pixmap | null = null;

  try {
    // Fetch the PDF data
    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      log({
        message: `Failed to fetch PDF in conversion process with error: \n\n Error: ${error} \n\n \`Metadata: {teamId: ${teamId}, documentVersionId: ${documentVersionId}, pageNumber: ${pageNumber}}\``,
        type: "error",
        mention: true,
      });
      res.status(502).json({
        error: "Failed to fetch PDF",
        details: `Failed to fetch pdf on document page ${pageNumber}`,
      });
      return;
    }

    if (!response.ok) {
      res.status(502).json({
        error: "Failed to fetch PDF",
        details: `HTTP ${response.status} when fetching PDF`,
      });
      return;
    }

    // Convert the response to a buffer
    const pdfData = await response.arrayBuffer();
    console.log("Original document size:", pdfData.byteLength);

    if (pdfData.byteLength > MAX_PDF_SIZE_BYTES) {
      res.status(413).json({
        error: "PDF too large",
        details: `PDF size ${(pdfData.byteLength / 1024 / 1024).toFixed(1)}MB exceeds limit of ${MAX_PDF_SIZE_MB}MB`,
      });
      return;
    }

    // Create a MuPDF instance
    doc = new mupdf.PDFDocument(pdfData);

    page = doc.loadPage(pageNumber - 1); // 0-based page index
    // get the bounds of the page for orientation and scaling
    const bounds = page.getBounds();
    const [ulx, uly, lrx, lry] = bounds;
    const widthInPoints = Math.abs(lrx - ulx);
    const heightInPoints = Math.abs(lry - uly);

    // Validate document dimensions
    if (widthInPoints <= 0 || heightInPoints <= 0) {
      res.status(400).json({
        error: "Invalid page dimensions",
        details: `${widthInPoints} × ${heightInPoints} points`,
      });
      return;
    }

    // Log original dimensions for debugging
    console.log(
      `Original page dimensions: ${widthInPoints} × ${heightInPoints} points (${(widthInPoints / 72).toFixed(1)}" × ${(heightInPoints / 72).toFixed(1)}")`,
    );

    if (pageNumber === 1) {
      const isVertical = heightInPoints > widthInPoints;
      await prisma.documentVersion.update({
        where: { id: documentVersionId },
        data: { isVertical },
      });
    }

    // Calculate optimal scale factor based on document dimensions and memory constraints
    const getOptimalScaleFactor = (width: number, height: number): number => {
      const MAX_PIXEL_DIMENSION = 6000;
      const MAX_TOTAL_PIXELS = 20_000_000; // ~20MP - reduced from 32MP to be safer with WASM memory

      // Note: Avoid scale factor 3 exactly due to mupdf 1.26.4 rendering bug with tiling patterns
      let scaleFactor = width >= 1600 ? 2 : 2.95;

      const scaledWidth = width * scaleFactor;
      const scaledHeight = height * scaleFactor;
      const totalPixels = scaledWidth * scaledHeight;

      if (
        scaledWidth > MAX_PIXEL_DIMENSION ||
        scaledHeight > MAX_PIXEL_DIMENSION ||
        totalPixels > MAX_TOTAL_PIXELS
      ) {
        const maxScaleByWidth = MAX_PIXEL_DIMENSION / width;
        const maxScaleByHeight = MAX_PIXEL_DIMENSION / height;
        const maxScaleByTotal = Math.sqrt(MAX_TOTAL_PIXELS / (width * height));

        scaleFactor = Math.min(
          maxScaleByWidth,
          maxScaleByHeight,
          maxScaleByTotal,
        );

        scaleFactor = Math.max(1, Math.floor(scaleFactor * 10) / 10);

        console.log(
          `Large document detected. Reduced scale factor from ${width >= 1600 ? 2 : 2.95} to ${scaleFactor}`,
        );
      }

      return scaleFactor;
    };

    const scaleFactor = getOptimalScaleFactor(widthInPoints, heightInPoints);
    const doc_to_screen = mupdf.Matrix.scale(scaleFactor, scaleFactor);

    console.log("Scale factor:", scaleFactor);
    console.log(
      "Final dimensions:",
      `${widthInPoints * scaleFactor} × ${heightInPoints * scaleFactor}`,
    );

    // get links
    const links = page.getLinks();
    const embeddedLinks = links.map((link) => {
      const coords = link.getBounds().join(",");

      if (!link.isExternal()) {
        try {
          const targetPage = doc!.resolveLink(link);
          if (targetPage >= 0) {
            return {
              href: `#page=${targetPage + 1}`,
              coords,
              isInternal: true,
              targetPage: targetPage + 1,
            };
          }
        } catch (e) {
          console.log("Failed to resolve internal link:", e);
        }
        return { href: "", coords, isInternal: true };
      }

      return { href: link.getURI(), coords, isInternal: false };
    });

    // Check embedded links for blocked keywords
    if (embeddedLinks.length > 0) {
      try {
        const keywords = await get("keywords");
        if (Array.isArray(keywords) && keywords.length > 0) {
          for (const link of embeddedLinks) {
            if (link.href) {
              const matchedKeyword = keywords.find(
                (keyword) =>
                  typeof keyword === "string" && link.href.includes(keyword),
              );

              if (matchedKeyword) {
                waitUntil(
                  log({
                    message: `Document processing blocked: ${matchedKeyword} \n\n \`Metadata: {teamId: ${teamId}, documentVersionId: ${documentVersionId}, pageNumber: ${pageNumber}}\``,
                    type: "error",
                    mention: true,
                  }),
                );
                res.status(400).json({
                  error: "Document processing blocked",
                  matchedUrl: link.href,
                  matchedKeyword: matchedKeyword,
                  pageNumber: pageNumber,
                });
                return;
              }
            }
          }
        }
      } catch (error) {
        console.log("Failed to check keywords:", error);
      }
    }

    let actualScaleFactor = scaleFactor;

    const metadata = {
      originalWidth: widthInPoints,
      originalHeight: heightInPoints,
      width: widthInPoints * actualScaleFactor,
      height: heightInPoints * actualScaleFactor,
      scaleFactor: actualScaleFactor,
    };

    // Estimate memory usage before creating pixmap
    const finalWidth = Math.floor(widthInPoints * scaleFactor);
    const finalHeight = Math.floor(heightInPoints * scaleFactor);
    const estimatedMemoryMB = (finalWidth * finalHeight * 3) / (1024 * 1024);

    console.log(
      `Estimated memory usage: ${estimatedMemoryMB.toFixed(1)}MB for ${finalWidth} × ${finalHeight} pixels`,
    );

    // Reject if estimated memory usage is too high for WASM
    if (estimatedMemoryMB > 512) {
      res.status(413).json({
        error: "Page too large to render",
        details: `Estimated memory usage ${estimatedMemoryMB.toFixed(0)}MB exceeds safe WASM limit`,
      });
      return;
    }

    if (estimatedMemoryMB > 200) {
      console.warn(
        `High memory usage expected: ${estimatedMemoryMB.toFixed(1)}MB. Consider reducing document size.`,
      );
    }

    console.time("toPixmap");
    try {
      scaledPixmap = page.toPixmap(
        doc_to_screen,
        mupdf.ColorSpace.DeviceRGB,
        false,
        true,
      );
    } catch (error) {
      console.error(
        "Pixmap creation failed, attempting with reduced scale factor:",
        error,
      );
      const reducedScaleFactor = Math.max(1, scaleFactor * 0.5);
      console.log(`Retrying with reduced scale factor: ${reducedScaleFactor}`);

      const reduced_doc_to_screen = mupdf.Matrix.scale(
        reducedScaleFactor,
        reducedScaleFactor,
      );

      try {
        scaledPixmap = page.toPixmap(
          reduced_doc_to_screen,
          mupdf.ColorSpace.DeviceRGB,
          false,
          true,
        );
      } catch (retryError) {
        if (isWasmMemoryError(retryError)) {
          res.status(503).json({
            error: "Service temporarily unavailable",
            details:
              "WASM memory limit reached during rendering. The request will succeed on retry.",
          });
          return;
        }
        throw retryError;
      }

      actualScaleFactor = reducedScaleFactor;
      metadata.width = widthInPoints * actualScaleFactor;
      metadata.height = heightInPoints * actualScaleFactor;
      metadata.scaleFactor = actualScaleFactor;
      console.log(
        "Successfully created pixmap with reduced scale factor:",
        actualScaleFactor,
      );
    }
    console.timeEnd("toPixmap");

    console.time("compare");
    console.time("asPNG");
    const pngBuffer = scaledPixmap.asPNG();
    console.timeEnd("asPNG");
    console.time("asJPEG");
    const jpegBuffer = scaledPixmap.asJPEG(80, false);
    console.timeEnd("asJPEG");

    const pngSize = pngBuffer.byteLength;
    const jpegSize = jpegBuffer.byteLength;

    let chosenBuffer;
    let chosenFormat;
    if (pngSize < jpegSize) {
      chosenBuffer = pngBuffer;
      chosenFormat = "png";
    } else {
      chosenBuffer = jpegBuffer;
      chosenFormat = "jpeg";
    }

    console.log("Chosen format:", chosenFormat);
    console.timeEnd("compare");

    let buffer = Buffer.from(chosenBuffer);

    // Free mupdf objects as soon as we have the buffer - before any async operations
    destroySafe(scaledPixmap);
    scaledPixmap = null;
    destroySafe(page);
    page = null;
    destroySafe(doc);
    doc = null;

    const match = url.match(/(doc_[^\/]+)\//);
    const docId = match ? match[1] : undefined;

    const { type, data } = await putFileServer({
      file: {
        name: `page-${pageNumber}.${chosenFormat}`,
        type: `image/${chosenFormat}`,
        buffer: buffer,
      },
      teamId: teamId,
      docId: docId,
    });

    buffer = Buffer.alloc(0);

    if (!data || !type) {
      res.status(500).json({
        error: "Upload failed",
        details: `Failed to upload document page ${pageNumber}`,
      });
      return;
    }

    let documentPage: DocumentPage | null = null;

    const existingPage = await prisma.documentPage.findUnique({
      where: {
        pageNumber_versionId: {
          pageNumber: pageNumber,
          versionId: documentVersionId,
        },
      },
    });

    if (!existingPage) {
      documentPage = await prisma.documentPage.create({
        data: {
          versionId: documentVersionId,
          pageNumber: pageNumber,
          file: data,
          storageType: type,
          pageLinks: embeddedLinks,
          metadata: metadata,
        },
      });
    } else {
      documentPage = existingPage;
    }

    res.status(200).json({ documentPageId: documentPage.id });
    return;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (isWasmMemoryError(error)) {
      console.error(
        `WASM memory error on page ${pageNumber}: ${message}`,
      );
      log({
        message: `WASM memory limit reached during page conversion: \n\n Error: ${message} \n\n \`Metadata: {teamId: ${teamId}, documentVersionId: ${documentVersionId}, pageNumber: ${pageNumber}}\``,
        type: "error",
        mention: true,
      });
      res.status(503).json({
        error: "Service temporarily unavailable",
        details:
          "WASM memory limit reached. The request will succeed on retry.",
      });
      return;
    }

    log({
      message: `Failed to convert page with error: \n\n Error: ${error} \n\n \`Metadata: {teamId: ${teamId}, documentVersionId: ${documentVersionId}, pageNumber: ${pageNumber}}\``,
      type: "error",
      mention: true,
    });
    res.status(500).json({
      error: "Failed to convert page",
      details: message,
    });
    return;
  } finally {
    // Always clean up mupdf objects to prevent WASM memory leaks
    destroySafe(scaledPixmap);
    destroySafe(page);
    destroySafe(doc);
  }
};
