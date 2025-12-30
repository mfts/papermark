import { WatermarkConfig } from "@/lib/types";
import { safeTemplateReplace } from "@/lib/utils";

export interface ViewerData {
  email: string | null;
  date: string;
  ipAddress: string;
  link: string | null;
  time: string;
}

export interface Dimensions {
  width: number;
  height: number;
}

/**
 * Calculate a responsive font size based on document dimensions.
 * The font size scales proportionally with the smaller dimension of the document.
 * This ensures watermarks appear the same relative size regardless of image resolution.
 *
 * Formula: fontSize = min(width, height) * (configFontSize / 1000)
 * - configFontSize of 16 means 1.6% of the smaller dimension
 * - Minimum 8px to ensure readability
 * - No upper limit to allow proper scaling on high-res images
 */
function calculateFontSize(
  dimensions: Dimensions,
  configFontSize: number,
): number {
  const { width, height } = dimensions;
  // Scale proportionally - remove upper clamp to maintain consistent relative size
  const baseFontSize = Math.min(width, height) * (configFontSize / 1000);
  return Math.max(8, baseFontSize); // Only clamp minimum for readability
}

/**
 * Get position coordinates for a single watermark
 */
function getPositionCoordinates(
  position: WatermarkConfig["position"],
  width: number,
  height: number,
  fontSize: number,
): { x: number; y: number } {
  switch (position) {
    case "top-left":
      return { x: fontSize / 2, y: fontSize };
    case "top-center":
      return { x: width / 2, y: fontSize };
    case "top-right":
      return { x: width - fontSize / 2, y: fontSize };
    case "middle-left":
      return { x: fontSize / 2, y: height / 2 };
    case "middle-center":
      return { x: width / 2, y: height / 2 };
    case "middle-right":
      return { x: width - fontSize / 2, y: height / 2 };
    case "bottom-left":
      return { x: fontSize / 2, y: height - fontSize };
    case "bottom-center":
      return { x: width / 2, y: height - fontSize };
    case "bottom-right":
      return { x: width - fontSize / 2, y: height - fontSize };
    default:
      return { x: width / 2, y: height / 2 };
  }
}

/**
 * Get text anchor based on position
 */
function getTextAnchor(
  position: WatermarkConfig["position"],
): "start" | "middle" | "end" {
  if (position.includes("right")) return "end";
  if (position.includes("center")) return "middle";
  return "start";
}

/**
 * Get dominant baseline based on position
 */
function getDominantBaseline(
  position: WatermarkConfig["position"],
): "hanging" | "middle" | "auto" {
  if (position.includes("top")) return "hanging";
  if (position.includes("middle")) return "middle";
  return "auto";
}

/**
 * Escape special XML characters in text
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Generate a tiled SVG watermark pattern
 */
function generateTiledSvg(
  text: string,
  fontSize: number,
  config: WatermarkConfig,
  dimensions: Dimensions,
): string {
  const { width, height } = dimensions;

  // Estimate text width (approximation)
  const textWidth = text.length * fontSize * 0.6;

  // Make pattern size larger than text to avoid cut-off
  const patternWidth = textWidth;
  const patternHeight = fontSize * 10;

  const escapedText = escapeXml(text);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <pattern id="watermarkPattern" patternUnits="userSpaceOnUse" width="${patternWidth}" height="${patternHeight}" patternTransform="rotate(-${config.rotation})">
      <text x="${patternWidth / 2}" y="${patternHeight / 4}" font-size="${fontSize}px" font-family="Helvetica, Arial, sans-serif" fill="${config.color}" opacity="${config.opacity}" text-anchor="middle" dominant-baseline="middle">${escapedText}</text>
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#watermarkPattern)"/>
</svg>`;
}

/**
 * Generate a single positioned SVG watermark
 */
function generatePositionedSvg(
  text: string,
  fontSize: number,
  config: WatermarkConfig,
  dimensions: Dimensions,
): string {
  const { width, height } = dimensions;
  const { x, y } = getPositionCoordinates(
    config.position,
    width,
    height,
    fontSize,
  );
  const textAnchor = getTextAnchor(config.position);
  const dominantBaseline = getDominantBaseline(config.position);

  const escapedText = escapeXml(text);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <text x="${x}" y="${y}" font-size="${fontSize}px" font-family="Helvetica, Arial, sans-serif" fill="${config.color}" opacity="${config.opacity}" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}" transform="rotate(${-config.rotation} ${x} ${y})">${escapedText}</text>
</svg>`;
}

/**
 * Generate an SVG watermark string that can be composited with sharp
 */
export function generateSvgWatermark(
  config: WatermarkConfig,
  viewerData: ViewerData,
  dimensions: Dimensions,
): string {
  const text = safeTemplateReplace(config.text, viewerData);
  const fontSize = calculateFontSize(dimensions, config.fontSize);

  if (config.isTiled) {
    return generateTiledSvg(text, fontSize, config, dimensions);
  }

  return generatePositionedSvg(text, fontSize, config, dimensions);
}
