import { NextApiRequest, NextApiResponse } from "next";

import fontkit from "@pdf-lib/fontkit";
import Handlebars from "handlebars";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

import { hexToRgb, log } from "@/lib/utils";

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

  // Compile the Handlebars template
  const template = Handlebars.compile(config.text);
  const watermarkText = template(viewerData);

  // Calculate a responsive font size
  const calculateFontSize = () => {
    const baseFontSize = Math.min(width, height) * (config.fontSize / 1000);
    return Math.max(8, Math.min(baseFontSize, config.fontSize));
  };
  const fontSize = calculateFontSize();

  const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
  const textHeight = font.heightAtSize(fontSize);

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

        page.drawText(watermarkText, {
          x,
          y,
          size: fontSize,
          font,
          color: hexToRgb(config.color) ?? rgb(0, 0, 0),
          opacity: config.opacity,
          rotate: degrees(config.rotation),
        });
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

    page.drawText(watermarkText, {
      x,
      y,
      size: fontSize,
      font,
      color: hexToRgb(config.color) ?? rgb(0, 0, 0),
      opacity: config.opacity,
      rotate: degrees(config.rotation),
    });
  }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // check if post method
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  // // Extract the API Key from the Authorization header
  // const authHeader = req.headers.authorization;
  // const token = authHeader?.split(" ")[1]; // Assuming the format is "Bearer [token]"

  // // Check if the API Key matches
  // if (token !== process.env.INTERNAL_API_KEY) {
  //   res.status(401).json({ message: "Unauthorized" });
  //   return;
  // }

  const { url, watermarkConfig, viewerData, numPages } = req.body as {
    url: string;
    watermarkConfig: WatermarkConfig;
    viewerData: ViewerData;
    numPages: number;
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
      'attachment; filename="watermarked.pdf"',
    );

    res.status(200).send(Buffer.from(pdfBytes));

    return;
  } catch (error) {
    log({
      message: `Failed to convert page with error: \n\n Error: ${error}`,
      type: "error",
      mention: true,
    });
    throw error;
  }
};
