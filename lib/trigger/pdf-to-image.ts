import { Prisma } from "@prisma/client";
import { logger, task } from "@trigger.dev/sdk/v3";
import { execSync } from "child_process";
import { createReadStream, createWriteStream } from "fs";
import fs from "fs/promises";
import fetch from "node-fetch";
import os from "os";
import path from "path";
import { pipeline } from "stream/promises";

import { getFile } from "@/lib/files/get-file";
import { streamFileServer } from "@/lib/files/stream-file-server";
import prisma from "@/lib/prisma";

import { updateStatus } from "../utils/generate-trigger-status";

type ConvertPdfToImagePayload = {
  documentId: string;
  documentVersionId: string;
  teamId: string;
  docId: string;
  versionNumber?: number;
};

interface PageLink {
  href: string;
  coords: string;
}

type DocumentPageMetadata = {
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
  scaleFactor: number;
};

function findPageNumberFromRef(
  pdfPath: string,
  ref: string,
): number | undefined {
  try {
    const output = execSync(`mutool show "${pdfPath}" pages | grep "${ref}"`, {
      encoding: "utf8",
    }).trim();

    const match = output.match(/page (\d+)/);
    return match ? parseInt(match[1]) : undefined;
  } catch (error) {
    return undefined;
  }
}

function extractPageLinks(pdfPath: string, pageNumber: number): PageLink[] {
  const links: PageLink[] = [];

  // Get page height first
  const mediaBoxOutput = execSync(
    `mutool show "${pdfPath}" "pages/${pageNumber}/MediaBox"`,
    { encoding: "utf8" },
  ).trim();

  const dimensions = mediaBoxOutput
    .replace(/[\[\]]/g, "")
    .trim()
    .split(/\s+/)
    .map(Number);

  const pageHeight = Math.abs(dimensions[3] - dimensions[1]);

  // Get annotations for the page
  const annotsOutput = execSync(
    `mutool show "${pdfPath}" pages/${pageNumber}/Annots`,
    { encoding: "utf8" },
  ).trim();

  if (!annotsOutput || annotsOutput === "null") {
    return links;
  }

  // Parse the array of annotation references
  const annotRefs = annotsOutput
    .replace(/[\[\]]/g, "")
    .trim()
    .split(/\s+/)
    .filter((ref) => ref.endsWith("R"));

  // Process each annotation
  for (let i = 1; i <= annotRefs.length; i++) {
    try {
      const annotOutput = execSync(
        `mutool show "${pdfPath}" pages/${pageNumber}/Annots/${i}`,
        { encoding: "utf8" },
      ).trim();

      // Check if annotation is present
      if (!annotOutput || annotOutput === "null") continue;

      // Check if annotation is a link
      if (!annotOutput.includes("/Subtype /Link")) continue;

      // Extract coordinates (Rect)
      const rectMatch = annotOutput.match(/\/Rect\s*\[\s*([\d\s.]+)\s*\]/);
      if (!rectMatch) continue;

      // Transform coordinates
      const rawCoords = rectMatch[1].trim().split(/\s+/).map(Number);
      if (rawCoords.length < 4) continue;

      // Transform y-coordinates by subtracting from page height
      const transformedCoords = [
        rawCoords[0], // x1
        pageHeight - rawCoords[3], // y1 (transformed)
        rawCoords[2], // x2
        pageHeight - rawCoords[1], // y2 (transformed)
      ].join(",");

      // Check for URI links
      const uriMatch = annotOutput.match(/\/URI\s*\((.*?)\)/);
      if (uriMatch) {
        links.push({
          href: uriMatch[1],
          coords: transformedCoords,
        });
        continue;
      }

      // Check for internal links (Dest)
      const destMatch = annotOutput.match(/\/Dest\s*\[\s*(\d+\s+0\s+R)/);
      if (destMatch) {
        const ref = destMatch[1];
        const targetPage = findPageNumberFromRef(pdfPath, ref);
        links.push({
          coords: transformedCoords,
          href: `#page=${targetPage}&zoom=100,nan,nan`,
        });
      }
    } catch (error) {
      logger.warn(`Failed to extract link ${i} from page ${pageNumber}`, {
        error,
      });
    }
  }

  return links;
}

export const convertPdfToImage = task({
  id: "convert-pdf-to-image",
  machine: {
    preset: "small-2x",
  },
  run: async (payload: ConvertPdfToImagePayload) => {
    const { documentId, documentVersionId, teamId, docId, versionNumber } =
      payload;

    updateStatus({ progress: 0, text: "Initializing..." });

    try {
      // Get document version
      const documentVersion = await prisma.documentVersion.findUnique({
        where: { id: documentVersionId },
        select: {
          file: true,
          storageType: true,
          numPages: true,
        },
      });

      if (!documentVersion) {
        updateStatus({ progress: 0, text: "Document not found" });
        throw new Error("Document version not found");
      }

      updateStatus({ progress: 10, text: "Retrieving file..." });
      // Get signed URL for the PDF
      const pdfUrl = await getFile({
        type: documentVersion.storageType,
        data: documentVersion.file,
      });

      if (!pdfUrl) {
        updateStatus({ progress: 0, text: "Failed to retrieve file" });
        throw new Error("Failed to get signed URL");
      }

      logger.info("Starting PDF conversion", { pdfUrl });

      // Create temp directory
      const tempDirectory = path.join(os.tmpdir(), `pdf_${Date.now()}`);
      await fs.mkdir(tempDirectory, { recursive: true });
      const pdfPath = path.join(tempDirectory, "input.pdf");

      // Stream PDF to temporary file
      const response = await fetch(pdfUrl);
      if (!response.body) {
        updateStatus({ progress: 0, text: "Failed to retrieve file" });
        throw new Error("Failed to fetch PDF stream");
      }

      logger.info("Streaming PDF to temporary file");
      await pipeline(response.body, createWriteStream(pdfPath));

      updateStatus({ progress: 10, text: "Converting document..." });

      // Get total pages and first page dimensions
      const getDimensions = execSync(
        `mutool show "${pdfPath}" "pages/1/MediaBox"`,
        { encoding: "utf8" },
      );
      // Parse dimensions, removing brackets and splitting on whitespace
      const dimensions = getDimensions
        .replace(/[\[\]]/g, "")
        .trim()
        .split(/\s+/)
        .map(parseFloat);
      const [ulx, uly, lrx, lry] = dimensions;
      const widthInPoints = Math.abs(lrx - ulx);
      const heightInPoints = Math.abs(lry - uly);
      const resolution = widthInPoints >= 1600 ? 288 : 432; // 2x or 3x of 144 DPI
      const scaleFactor = resolution / 144;

      const getTotalPages = execSync(
        `mutool show "${pdfPath}" trailer/Root/Pages/Count`,
        { encoding: "utf8" },
      );
      const totalPages = parseInt(getTotalPages.trim());

      logger.info("PDF metadata", {
        totalPages,
        widthInPoints,
        heightInPoints,
        resolution,
        scaleFactor,
      });

      // Update document version with total pages
      await prisma.documentVersion.update({
        where: { id: documentVersionId },
        data: { numPages: totalPages },
      });

      // Process each page
      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
        const pngOutputPath = path.join(tempDirectory, `page-${pageNumber}`);
        const jpegOutputPath = path.join(tempDirectory, `page-${pageNumber}`);

        // The actual files will have "1" appended by mutool
        const pngPath = `${pngOutputPath}1.png`;
        const jpegPath = `${jpegOutputPath}1.jpg`;

        try {
          // Convert to PNG
          execSync(
            `mutool convert -o "${pngOutputPath}.png" -F png -O "resolution=${resolution}" "${pdfPath}" ${pageNumber}`,
          );
          // Convert to JPEG
          execSync(
            `mutool convert -o "${jpegOutputPath}.jpg" -F jpeg -O "resolution=${resolution},quality=80" "${pdfPath}" ${pageNumber}`,
          );
        } catch (error) {
          updateStatus({
            progress: (100 * pageNumber) / totalPages,
            text: `Error processing page ${pageNumber} of ${totalPages}`,
          });
          throw new Error("Failed to convert document");
        }

        // Get file sizes
        const pngStats = await fs.stat(pngPath);
        const jpegStats = await fs.stat(jpegPath);

        // Choose smaller file
        const useJpeg = jpegStats.size < pngStats.size;
        const finalPath = useJpeg ? jpegPath : pngPath;
        const mimeType = useJpeg ? "image/jpeg" : "image/png";
        const extension = useJpeg ? "jpeg" : "png";

        logger.info(`Page ${pageNumber} format selection`, {
          pngSize: pngStats.size,
          jpegSize: jpegStats.size,
          chosen: useJpeg ? "jpeg" : "png",
        });

        // Clean up unused file
        await fs.unlink(useJpeg ? pngPath : jpegPath);

        // Stream to storage
        const fileStream = createReadStream(finalPath);
        const { type, data } = await streamFileServer({
          file: {
            name: `page-${pageNumber}.${extension}`,
            type: mimeType,
            stream: fileStream,
          },
          teamId,
          docId,
        });

        if (!data) {
          updateStatus({
            progress: (100 * pageNumber) / totalPages,
            text: `Error saving page ${pageNumber} of ${totalPages}`,
          });
          throw new Error(`Failed to upload page ${pageNumber}`);
        }

        const pageLinks = extractPageLinks(pdfPath, pageNumber);

        // Create document page
        await prisma.documentPage.create({
          data: {
            versionId: documentVersionId,
            pageNumber,
            file: data,
            storageType: type,
            pageLinks: pageLinks as unknown as Prisma.InputJsonValue,
            metadata: {
              originalWidth: widthInPoints,
              originalHeight: heightInPoints,
              width: widthInPoints * scaleFactor,
              height: heightInPoints * scaleFactor,
              scaleFactor,
            } as unknown as Prisma.InputJsonValue,
          },
        });

        updateStatus({
          progress: (100 * pageNumber) / totalPages,
          text: `${pageNumber} / ${totalPages} pages processed`,
        });

        logger.info(`Uploaded page ${pageNumber}`, { type, data });
      }

      // Update document version
      await prisma.documentVersion.update({
        where: { id: documentVersionId },
        data: {
          hasPages: true,
          isPrimary: true,
        },
      });

      updateStatus({
        progress: 100,
        text: "Enabling pages...",
      });

      // If versionNumber is provided, update other versions to not be primary
      if (versionNumber) {
        await prisma.documentVersion.updateMany({
          where: {
            documentId: docId,
            versionNumber: {
              not: versionNumber,
            },
          },
          data: {
            isPrimary: false,
          },
        });
      }

      updateStatus({
        progress: 95,
        text: "Revalidating links...",
      });

      await fetch(
        `${process.env.NEXTAUTH_URL}/api/revalidate?secret=${process.env.REVALIDATE_TOKEN}&documentId=${documentId}`,
      );

      // Clean up temporary directory
      await fs.rm(tempDirectory, { recursive: true });
      logger.info("Temporary directory cleaned up", { tempDirectory });

      updateStatus({
        progress: 100,
        text: "Processing complete",
      });

      return {
        success: true,
        message: "Successfully converted PDF to images",
        totalPages,
      };
    } catch (error) {
      updateStatus({
        progress: 0,
        text: "Failed to convert PDF",
      });
      logger.error("Failed to convert PDF:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  },
});
