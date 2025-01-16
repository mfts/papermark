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

export const convertPdfToImage = task({
  id: "convert-pdf-to-image",
  machine: {
    preset: "small-2x",
  },
  run: async (payload: {
    documentVersionId: string;
    teamId: string;
    docId: string;
    versionNumber?: number;
  }) => {
    const { documentVersionId, teamId, docId, versionNumber } = payload;

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
        throw new Error("Document version not found");
      }

      // Get signed URL for the PDF
      const pdfUrl = await getFile({
        type: documentVersion.storageType,
        data: documentVersion.file,
      });

      if (!pdfUrl) {
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
        throw new Error("Failed to fetch PDF stream");
      }

      logger.info("Streaming PDF to temporary file");
      await pipeline(response.body, createWriteStream(pdfPath));

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

        // Convert to PNG
        execSync(
          `mutool convert -o "${pngOutputPath}.png" -F png -O "resolution=${resolution}" "${pdfPath}" ${pageNumber}`,
        );
        // Convert to JPEG
        execSync(
          `mutool convert -o "${jpegOutputPath}.jpg" -F jpeg -O "resolution=${resolution},quality=80" "${pdfPath}" ${pageNumber}`,
        );

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
          throw new Error(`Failed to upload page ${pageNumber}`);
        }

        // Create document page
        await prisma.documentPage.create({
          data: {
            versionId: documentVersionId,
            pageNumber,
            file: data,
            storageType: type,
            metadata: {
              originalWidth: widthInPoints,
              originalHeight: heightInPoints,
              width: widthInPoints * scaleFactor,
              height: heightInPoints * scaleFactor,
              scaleFactor,
            },
          },
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

      // Clean up temporary directory
      await fs.rm(tempDirectory, { recursive: true });
      logger.info("Temporary directory cleaned up", { tempDirectory });

      return {
        success: true,
        message: "Successfully converted PDF to images",
        totalPages,
      };
    } catch (error) {
      logger.error("Failed to convert PDF:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  },
});
