import { NextApiRequest, NextApiResponse } from "next";

import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

import {
  getFileNameWithPdfExtension,
  hexToRgb,
  log,
  safeTemplateReplace,
} from "@/lib/utils";

// This function can run for a maximum of 120 seconds
export const config = {
  maxDuration: 180,
};

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
): Promise<void> {
  const pages = pdfDoc.getPages();
  const page = pages[pageIndex];
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

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

  try {
    // Fetch the PDF data
    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      log({
        message: `Failed to fetch PDF in conversion process with error: \n\n Error: ${error}`,
        type: "error",
        mention: true,
      });
      throw new Error(`Failed to fetch pdf`);
    }

    // Convert the response to a buffer
    const pdfBuffer = await response.arrayBuffer();

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    // Register fontkit
    pdfDoc.registerFontkit(fontkit);

    // Add watermark to each page
    for (let i = 0; i < numPages; i++) {
      await insertWatermark(pdfDoc, watermarkConfig, viewerData, i);
    }

    // Save the modified PDF
    const pdfBytes = await pdfDoc.save();

    // Set appropriate headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(getFileNameWithPdfExtension(originalFileName))}"`,
    );

    res.status(200).send(Buffer.from(pdfBytes));

    return;
  } catch (error) {
    log({
      message: `Failed to convert page with error: \n\n Error: ${error}`,
      type: "error",
      mention: true,
    });

    // Return proper error response instead of throwing
    res.status(500).json({
      error: "Failed to apply watermark",
      details: (error as Error).message,
    });
    return;
  }
};
