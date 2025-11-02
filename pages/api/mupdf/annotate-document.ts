import { NextApiRequest, NextApiResponse } from "next";

import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFFont, StandardFonts, degrees, rgb } from "pdf-lib";

import {
  getFileNameWithPdfExtension,
  hexToRgb,
  log,
  safeTemplateReplace,
} from "@/lib/utils";

// This function can run for a maximum of 300 seconds
export const config = {
  maxDuration: 300,
};

/**
 * Validates a URL to prevent SSRF attacks.
 * Only allows HTTPS requests to the configured distribution hosts.
 */
function validateUrl(urlString: string): URL {
  let parsedUrl: URL;

  // Parse the URL
  try {
    parsedUrl = new URL(urlString);
  } catch (error) {
    throw new Error("Invalid URL format");
  }

  // Validate protocol - only HTTPS allowed
  if (parsedUrl.protocol !== "https:") {
    throw new Error("Only HTTPS URLs are allowed");
  }

  // Get allowed distribution hosts from environment
  const allowedHosts = [
    process.env.NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST,
    process.env.NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST_US,
  ].filter((host): host is string => !!host);

  if (allowedHosts.length === 0) {
    throw new Error("No distribution hosts configured");
  }

  // Validate hostname against allow-list
  const hostname = parsedUrl.hostname.toLowerCase();
  const isAllowedHost = allowedHosts.some(
    (allowedHost) => hostname === allowedHost.toLowerCase(),
  );

  if (!isAllowedHost) {
    throw new Error(
      "Host not allowed. Only requests to configured distribution hosts are permitted",
    );
  }

  return parsedUrl;
}

interface WatermarkConfig {
  text: string;
  isTiled: boolean;
  position:
    | "top-left"
    | "top-center"
    | "top-right"
    | "middle-left"
    | "middle-center"
    | "middle-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  rotation: 0 | 30 | 45 | 90 | 180;
  color: string;
  fontSize: number;
  opacity: number; // 0 to 0.8
}

interface ViewerData {
  email: string;
  date: string;
  ipAddress: string;
  link: string;
  time: string;
}

function getPositionCoordinates(
  position: WatermarkConfig["position"],
  width: number,
  height: number,
  textWidth: number,
  textHeight: number,
): number[] {
  const positions = {
    "top-left": [10, height - textHeight],
    "top-center": [(width - textWidth) / 2, height - textHeight],
    "top-right": [width - textWidth - 10, height - textHeight],
    "middle-left": [10, (height - textHeight) / 2],
    "middle-center": [(width - textWidth) / 2, (height - textHeight) / 2],
    "middle-right": [width - textWidth - 10, (height - textHeight) / 2],
    "bottom-left": [10, 20],
    "bottom-center": [(width - textWidth) / 2, 20],
    "bottom-right": [width - textWidth - 10, 20],
  };
  return positions[position];
}

async function insertWatermark(
  pdfDoc: PDFDocument,
  config: WatermarkConfig,
  viewerData: ViewerData,
  pageIndex: number,
  font: PDFFont, // Pre-embedded font passed in
): Promise<void> {
  const pages = pdfDoc.getPages();
  const page = pages[pageIndex];
  const { width, height } = page.getSize();

  // Safely replace template variables with whitelisted values only
  const rawWatermarkText = safeTemplateReplace(config.text, viewerData);

  // Handle Unicode characters that can't be encoded in WinAnsi
  const sanitizeText = (text: string): string => {
    // Common character replacements for WinAnsi compatibility
    const replacements: { [key: string]: string } = {
      // Turkish characters
      İ: "I",
      ı: "i",
      ğ: "g",
      Ğ: "G",
      ü: "u",
      Ü: "U",
      ş: "s",
      Ş: "S",
      ç: "c",
      Ç: "C",
      ö: "o",
      Ö: "O",
      // German characters
      ß: "ss",
      ä: "a",
      Ä: "A",
      ë: "e",
      Ë: "E",
      // French characters
      à: "a",
      À: "A",
      é: "e",
      É: "E",
      è: "e",
      È: "E",
      ê: "e",
      Ê: "E",
      ù: "u",
      Ù: "U",
      ô: "o",
      Ô: "O",
      // Spanish characters
      ñ: "n",
      Ñ: "N",
      á: "a",
      Á: "A",
      í: "i",
      Í: "I",
      ó: "o",
      Ó: "O",
      ú: "u",
      Ú: "U",
      // Common symbols
      "€": "EUR",
      "£": "GBP",
      "¥": "JPY",
      "©": "(c)",
      "®": "(R)",
      "™": "TM",
      "…": "...",
      "–": "-",
      "—": "-",
      "\u201C": '"',
      "\u201D": '"',
      "\u2018": "'",
      "\u2019": "'",
      "•": "*",
    };

    let sanitized = text;

    // Apply character replacements
    for (const [original, replacement] of Object.entries(replacements)) {
      sanitized = sanitized.replace(new RegExp(original, "g"), replacement);
    }

    // Replace any remaining non-WinAnsi characters (outside Latin-1 range)
    sanitized = sanitized.replace(/[^\u0000-\u00FF]/g, "?");

    return sanitized;
  };

  const watermarkText = sanitizeText(rawWatermarkText);

  // Calculate a responsive font size
  const calculateFontSize = () => {
    const baseFontSize = Math.min(width, height) * (config.fontSize / 1000);
    return Math.max(8, Math.min(baseFontSize, config.fontSize));
  };
  const fontSize = calculateFontSize();

  // Calculate text dimensions with error handling
  let textWidth: number;
  let textHeight: number;

  try {
    textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
    textHeight = font.heightAtSize(fontSize);
  } catch (error) {
    // If there are still encoding issues, provide fallback values
    console.warn("Font encoding error:", error);
    textWidth = watermarkText.length * fontSize * 0.6; // Approximate width
    textHeight = fontSize * 1.2; // Approximate height
  }

  if (config.isTiled) {
    const patternWidth = textWidth / 1.1;
    const patternHeight = textHeight * 15;

    // Calculate the offset to center the pattern
    const offsetX = -patternWidth / 4;
    const offsetY = -patternHeight / 4;

    const maxTilesPerRow = Math.ceil(width / patternWidth) + 1;
    const maxTilesPerColumn = Math.ceil(height / patternHeight) + 1;

    for (let i = 0; i < maxTilesPerRow; i++) {
      for (let j = 0; j < maxTilesPerColumn; j++) {
        const x = i * patternWidth + offsetX;
        const y = j * patternHeight + offsetY;

        try {
          page.drawText(watermarkText, {
            x,
            y,
            size: fontSize,
            font,
            color: hexToRgb(config.color) ?? rgb(0, 0, 0),
            opacity: config.opacity,
            rotate: degrees(config.rotation),
          });
        } catch (error) {
          console.error("Error drawing tiled watermark text:", error);
          throw new Error(
            `Failed to apply watermark to page ${pageIndex + 1}: ${error}`,
          );
        }
      }
    }
  } else {
    const [x, y] = getPositionCoordinates(
      config.position,
      width,
      height,
      textWidth,
      textHeight,
    );

    try {
      page.drawText(watermarkText, {
        x,
        y,
        size: fontSize,
        font,
        color: hexToRgb(config.color) ?? rgb(0, 0, 0),
        opacity: config.opacity,
        rotate: degrees(config.rotation),
      });
    } catch (error) {
      console.error("Error drawing positioned watermark text:", error);
      throw new Error(
        `Failed to apply watermark to page ${pageIndex + 1}: ${error}`,
      );
    }
  }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // check if post method
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  // Extract the API Key from the Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1]; // Assuming the format is "Bearer [token]"

  // Check if the API Key matches
  if (token !== process.env.INTERNAL_API_KEY) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { url, watermarkConfig, viewerData, numPages, originalFileName } =
    req.body as {
      url: string;
      watermarkConfig: WatermarkConfig;
      viewerData: ViewerData;
      numPages: number;
      originalFileName?: string;
    };

  // Validate required fields
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Invalid or missing URL" });
  }

  if (!watermarkConfig || typeof watermarkConfig !== "object") {
    return res
      .status(400)
      .json({ error: "Invalid or missing watermark config" });
  }

  if (!numPages || typeof numPages !== "number" || numPages <= 0) {
    return res.status(400).json({ error: "Invalid page count" });
  }

  if (numPages > 1000) {
    return res.status(400).json({
      error: "Document too large",
      details: "Maximum 1000 pages supported",
    });
  }

  const startTime = Date.now();

  // Validate URL to prevent SSRF attacks
  let validatedUrl: URL;
  try {
    validatedUrl = validateUrl(url);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
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

  try {
    // Fetch the PDF data with timeout
    let response: Response;
    try {
      const fetchStart = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for fetch

      // Use the validated URL string for the fetch
      response = await fetch(validatedUrl.toString(), {
        signal: controller.signal,
        headers: {
          Accept: "application/pdf",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`PDF fetch took ${Date.now() - fetchStart}ms`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log({
        message: `Failed to fetch PDF in conversion process with error: \n\n Error: ${errorMsg}\nURL: ${url}`,
        type: "error",
        mention: true,
      });

      if (errorMsg.includes("aborted")) {
        throw new Error(`Timeout fetching PDF (exceeded 60s)`);
      }
      throw new Error(`Failed to fetch PDF: ${errorMsg}`);
    }

    // Convert the response to a buffer
    const bufferStart = Date.now();
    const pdfBuffer = await response.arrayBuffer();
    const sizeInMB = pdfBuffer.byteLength / 1024 / 1024;
    console.log(
      `Buffer conversion took ${Date.now() - bufferStart}ms, size: ${sizeInMB.toFixed(2)}MB`,
    );

    // Load the PDF document with optimizations
    const loadStart = Date.now();
    const pdfDoc = await PDFDocument.load(pdfBuffer, {
      updateMetadata: false, // Skip metadata updates for performance
      ignoreEncryption: false, // Respect encryption
    });
    console.log(`PDF load took ${Date.now() - loadStart}ms`);

    // Register fontkit and embed font ONCE
    pdfDoc.registerFontkit(fontkit);
    const fontStart = Date.now();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    console.log(`Font embedding took ${Date.now() - fontStart}ms`);

    // Calculate optimal batch size based on document size and page count
    // Larger documents = smaller batches to prevent memory spikes
    const calculateBatchSize = (pages: number, sizeMB: number): number => {
      if (sizeMB > 50 || pages > 200) return 5; // Large docs: 5 pages at a time
      if (sizeMB > 20 || pages > 100) return 10; // Medium docs: 10 pages
      return 20; // Smaller docs: 20 pages at a time
    };

    const BATCH_SIZE = calculateBatchSize(numPages, sizeInMB);
    const watermarkStart = Date.now();

    console.log(`Processing ${numPages} pages in batches of ${BATCH_SIZE}`);

    for (let batchStart = 0; batchStart < numPages; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, numPages);
      const batchPromises = [];

      for (let i = batchStart; i < batchEnd; i++) {
        batchPromises.push(
          insertWatermark(pdfDoc, watermarkConfig, viewerData, i, font).catch(
            (error) => {
              const errMsg =
                error instanceof Error ? error.message : String(error);
              console.error(`Error watermarking page ${i + 1}:`, errMsg);
              throw new Error(`Failed to watermark page ${i + 1}: ${errMsg}`);
            },
          ),
        );
      }

      await Promise.all(batchPromises);
      const progress = ((batchEnd / numPages) * 100).toFixed(1);
      console.log(
        `Processed pages ${batchStart + 1}-${batchEnd} of ${numPages} (${progress}%)`,
      );
    }

    console.log(`All watermarking took ${Date.now() - watermarkStart}ms`);

    // Save the modified PDF with optimizations
    const saveStart = Date.now();
    const pdfBytes = await pdfDoc.save({
      useObjectStreams: false, // Better compatibility, slight size increase
      addDefaultPage: false, // Don't add default page
      objectsPerTick: 50, // Process objects in smaller chunks for better memory management
    });
    const finalSizeMB = pdfBytes.length / 1024 / 1024;
    console.log(
      `PDF save took ${Date.now() - saveStart}ms, final size: ${finalSizeMB.toFixed(2)}MB`,
    );

    console.log(
      `Total processing time: ${Date.now() - startTime}ms for ${numPages} pages`,
    );

    // Set appropriate headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(getFileNameWithPdfExtension(originalFileName))}"`,
    );

    res.status(200).send(Buffer.from(pdfBytes));

    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
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
    } else if (errorMessage.includes("Failed to watermark page")) {
      statusCode = 500;
      errorType = "Watermarking error";
    }

    log({
      message: `${errorType} after ${elapsedTime}ms: ${errorMessage}\n\nDocument: ${originalFileName || "unknown"}\nPages: ${numPages}\nURL: ${url?.substring(0, 100)}...`,
      type: "error",
      mention: elapsedTime > 120000, // Only mention if it took more than 2 minutes
    });

    // Return proper error response
    res.status(statusCode).json({
      error: errorType,
      details: errorMessage,
      processingTime: elapsedTime,
    });
    return;
  }
};
