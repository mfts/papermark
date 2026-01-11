import { z } from "zod";

import { WatermarkConfigSchema } from "@/lib/types";

/**
 * Validates a URL to prevent SSRF attacks.
 * Only allows HTTPS requests to the configured distribution hosts.
 */
export function validateUrl(urlString: string): URL {
  let parsedUrl: URL;

  // Parse the URL
  try {
    parsedUrl = new URL(urlString);
  } catch {
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

/**
 * Get output format from content type - only PNG and JPEG supported
 */
export function getOutputFormat(contentType: string | null): "png" | "jpeg" {
  if (contentType?.includes("jpeg") || contentType?.includes("jpg")) {
    return "jpeg";
  }
  return "png"; // Default to PNG (no WebP support for watermarking)
}

/**
 * Detect format from file path (e.g., page-1.png vs page-1.jpeg)
 */
export function getFormatFromFilePath(filePath: string): "png" | "jpeg" {
  return filePath.endsWith(".jpeg") || filePath.endsWith(".jpg")
    ? "jpeg"
    : "png";
}

/**
 * Check if a document type is an image
 */
export function isImageType(type: string | null): boolean {
  if (!type) return false;
  return ["image", "png", "jpg", "jpeg", "gif", "webp"].includes(
    type.toLowerCase(),
  );
}

/**
 * Get appropriate content type for watermarked output
 */
export function getWatermarkedContentType(format: "png" | "jpeg"): string {
  return format === "jpeg" ? "image/jpeg" : "image/png";
}

/**
 * Get appropriate file extension for watermarked output
 */
export function getWatermarkedExtension(format: "png" | "jpeg"): string {
  return format === "jpeg" ? ".jpeg" : ".png";
}

/**
 * Ensures a filename has the correct extension for the output format
 */
export function getFileNameWithExtension(
  filename: string | undefined,
  format: "png" | "jpeg" | "pdf",
): string {
  if (!filename) {
    return format === "pdf" ? "document.pdf" : `image.${format}`;
  }

  // Remove existing extension and add the correct one
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  return `${nameWithoutExt}.${format}`;
}

/**
 * Calculate optimal batch size based on page count and document size
 */
export function calculateBatchSize(
  pageCount: number,
  sizeMB?: number,
): number {
  if ((sizeMB && sizeMB > 50) || pageCount > 200) return 5;
  if ((sizeMB && sizeMB > 20) || pageCount > 100) return 10;
  return 20;
}

/**
 * Schema for viewer data included in watermarks
 */
export const ViewerDataSchema = z.object({
  email: z.string().nullable(),
  date: z.string(),
  ipAddress: z.string(),
  link: z.string().nullable(),
  time: z.string(),
});

export type ViewerData = z.infer<typeof ViewerDataSchema>;

/**
 * Base schema for common watermark request fields
 */
const BaseWatermarkRequestSchema = z.object({
  watermarkConfig: WatermarkConfigSchema,
  viewerData: ViewerDataSchema,
  originalFileName: z.string().optional(),
});

/**
 * Schema for image watermark requests
 */
const ImageWatermarkRequestSchema = BaseWatermarkRequestSchema.extend({
  url: z.string().url("Invalid URL format"),
  outputFormat: z.enum(["png", "jpeg"]).optional().default("png"),
  documentVersionId: z.undefined().optional(),
  numPages: z.undefined().optional(),
});

/**
 * Schema for PDF watermark requests
 */
const PdfWatermarkRequestSchema = BaseWatermarkRequestSchema.extend({
  url: z.undefined().optional(),
  outputFormat: z.undefined().optional(),
  documentVersionId: z.string().min(1, "Document version ID is required"),
  numPages: z
    .number()
    .int()
    .positive("Page count must be positive")
    .max(1000, "Document too large - maximum 1000 pages supported"),
});

/**
 * Combined schema for watermark requests (either image or PDF)
 */
export const WatermarkRequestSchema = z.union([
  ImageWatermarkRequestSchema,
  PdfWatermarkRequestSchema,
]);

export type WatermarkRequestBody = z.infer<typeof WatermarkRequestSchema>;

/**
 * Validate watermark request body using Zod
 */
export function validateWatermarkRequest(body: unknown): WatermarkRequestBody {
  const result = WatermarkRequestSchema.safeParse(body);

  if (!result.success) {
    const errors = result.error.errors
      .map((err) => `${err.path.join(".")}: ${err.message}`)
      .join("; ");
    throw new Error(`Invalid watermark request: ${errors}`);
  }

  return result.data;
}
