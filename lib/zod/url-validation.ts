import { parsePageId } from "notion-utils";
import { z } from "zod";

import {
  SUPPORTED_DOCUMENT_MIME_TYPES,
  SUPPORTED_DOCUMENT_SIMPLE_TYPES,
} from "@/lib/constants";
import {
  getNotionPageIdFromSlug,
  isCustomNotionDomain,
} from "@/lib/notion/utils";
import { getSupportedContentType } from "@/lib/utils/get-content-type";

/**
 * Validates basic security aspects of paths and URLs
 * Prevents directory traversal, null byte injection, and double encoding attacks
 */
export const validatePathSecurity = (pathOrUrl: string): boolean => {
  // Prevent directory traversal attacks
  if (pathOrUrl.includes("../") || pathOrUrl.includes("..\\")) {
    return false;
  }

  // Prevent null byte attacks
  if (pathOrUrl.includes("\0")) {
    return false;
  }

  // Prevent double encoding attacks
  if (pathOrUrl.includes("%2E%2E") || pathOrUrl.includes("%2F%2F")) {
    return false;
  }

  return true;
};

/**
 * Validates URL for SSRF protection
 * Blocks internal/private IP ranges, localhost, and link-local addresses
 */
export const validateUrlSSRFProtection = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // Block localhost/loopback
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1"
    ) {
      return false;
    }

    // Block private IP ranges (simplified check)
    if (hostname.match(/^10\.|^172\.(1[6-9]|2[0-9]|3[01])\.|^192\.168\./)) {
      return false;
    }

    // Block link-local addresses
    if (hostname.match(/^169\.254\./)) {
      return false;
    }

    // Block IPv6 link-local addresses (fe80::/10)
    if (hostname.toLowerCase().startsWith("fe80:")) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Comprehensive security validation for URLs
 * Combines path security and SSRF protection
 */
export const validateUrlSecurity = (url: string): boolean => {
  return validatePathSecurity(url) && validateUrlSSRFProtection(url);
};

// Custom validator for file paths - either Notion URLs or S3 storage paths
const createFilePathValidator = () => {
  return z
    .string()
    .min(1, "File path is required")
    .refine(
      async (path) => {
        // Case 1: Notion URLs - must start with notion domains
        if (path.startsWith("https://")) {
          try {
            const urlObj = new URL(path);
            const hostname = urlObj.hostname;

            // Valid notion domains
            const validNotionDomains = ["www.notion.so", "notion.so"];

            // Check for notion.site subdomains (e.g., example-something.notion.site)
            const isNotionSite = hostname.endsWith(".notion.site");
            const isValidNotionDomain = validNotionDomains.includes(hostname);

            // Check for vercel blob storage
            let isVercelBlob = false;
            if (process.env.VERCEL_BLOB_HOST) {
              isVercelBlob = hostname.startsWith(process.env.VERCEL_BLOB_HOST);
            }

            // If it's not a standard Notion domain or Vercel blob, check if it's a custom Notion domain
            if (!isNotionSite && !isValidNotionDomain && !isVercelBlob) {
              try {
                let pageId = parsePageId(path);
                if (!pageId) {
                  const pageIdFromSlug = await getNotionPageIdFromSlug(path);
                  if (pageIdFromSlug) {
                    pageId = pageIdFromSlug;
                  }
                }
                return !!pageId;
              } catch {
                return false;
              }
            }

            return isNotionSite || isValidNotionDomain || isVercelBlob;
          } catch {
            return false;
          }
        }

        // Case 2: file storage paths - must match pattern: <id>/doc_<someId>/<name>.<ext>
        const s3PathPattern =
          /^[a-zA-Z0-9_-]+\/doc_[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+\.[a-zA-Z0-9]+$/;
        return s3PathPattern.test(path);
      },
      {
        message:
          "File path must be either a Notion URL or an file storage path",
      },
    )
    .refine(
      (path) => {
        // Additional security checks for all paths
        return validatePathSecurity(path);
      },
      {
        message: "File path contains invalid or malicious characters",
      },
    );
};

// File path validation schema
export const filePathSchema = createFilePathValidator();

// Dedicated Notion URL validation schema for URL updates
export const notionUrlUpdateSchema = z
  .string()
  .url("Invalid URL format")
  .refine((url) => url.startsWith("https://"), {
    message: "Notion URL must use HTTPS",
  })
  .refine(
    async (url) => {
      try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;

        // Valid notion domains
        const validNotionDomains = ["www.notion.so", "notion.so"];
        const isNotionSite = hostname.endsWith(".notion.site");
        const isValidNotionDomain = validNotionDomains.includes(hostname);

        // If it's a standard Notion domain, try to extract page ID
        if (isNotionSite || isValidNotionDomain) {
          let pageId = parsePageId(url);
          if (!pageId) {
            try {
              const pageIdFromSlug = await getNotionPageIdFromSlug(url);
              pageId = pageIdFromSlug || undefined;
            } catch {
              return false;
            }
          }
          return !!pageId;
        }

        // For custom domains, try to extract and validate page ID
        try {
          let pageId = parsePageId(url);
          if (!pageId) {
            const pageIdFromSlug = await getNotionPageIdFromSlug(url);
            pageId = pageIdFromSlug || undefined;
          }
          return !!pageId;
        } catch {
          return false;
        }
      } catch {
        return false;
      }
    },
    {
      message:
        "Must be a valid Notion URL (supports notion.so, notion.site, and custom domains)",
    },
  )
  .refine(
    (url) => {
      // Additional security checks
      return validatePathSecurity(url) && validateUrlSSRFProtection(url);
    },
    {
      message: "URL contains invalid characters or targets internal resources",
    },
  );

// Document upload validation schema with comprehensive type and content validation
export const documentUploadSchema = z
  .object({
    name: z
      .string()
      .min(1, "Document name is required")
      .max(255, "Document name too long"),
    url: filePathSchema,
    storageType: z
      .enum(["S3_PATH", "VERCEL_BLOB"], {
        errorMap: () => ({ message: "Invalid storage type" }),
      })
      .default("VERCEL_BLOB"),
    numPages: z.number().int().positive().optional(),
    type: z.enum(
      SUPPORTED_DOCUMENT_SIMPLE_TYPES as unknown as readonly [
        string,
        ...string[],
      ],
      {
        errorMap: () => ({
          message: `File type must be one of: ${SUPPORTED_DOCUMENT_SIMPLE_TYPES.join(", ")}`,
        }),
      },
    ),
    folderPathName: z.string().optional(),
    contentType: z
      .enum(
        SUPPORTED_DOCUMENT_MIME_TYPES as unknown as readonly [
          string,
          ...string[],
        ],
        {
          errorMap: () => ({ message: "Unsupported content type" }),
        },
      )
      .or(z.literal("text/html")) // Allow text/html for Notion documents
      .nullish(), // Make contentType optional for Notion files
    createLink: z.boolean().optional(),
    fileSize: z.number().int().positive().optional(),
  })
  .refine(
    (data) => {
      // Skip content type validation if it's not provided (e.g., for Notion files)
      if (!data.contentType) {
        return data.type === "notion";
      }

      // Validate that content type matches the declared file type
      const expectedType = getSupportedContentType(data.contentType);

      // Special case for Notion documents
      if (data.contentType === "text/html" && data.type === "notion") {
        return true;
      }

      return expectedType === data.type;
    },
    {
      message: "Content type does not match the declared file type",
      path: ["contentType"], // This will highlight the contentType field in errors
    },
  )
  .refine(
    async (data) => {
      // Skip storage type validation if not provided (e.g., for Notion files)
      if (!data.storageType) {
        // For Notion URLs, storage type is not required
        if (data.url.startsWith("https://")) {
          try {
            const urlObj = new URL(data.url);
            const hostname = urlObj.hostname;
            const isStandardNotion =
              hostname === "www.notion.so" ||
              hostname === "notion.so" ||
              hostname.endsWith(".notion.site");

            if (isStandardNotion) {
              return true;
            }

            // Check if it's a custom Notion domain
            try {
              return await isCustomNotionDomain(data.url);
            } catch {
              return false;
            }
          } catch {
            return false;
          }
        }
        // For file paths without storage type, this is invalid
        return false;
      }

      // Validate storage type consistency with path format
      if (data.storageType === "S3_PATH") {
        // S3_PATH should use file paths, not URLs
        return !data.url.startsWith("https://");
      } else if (data.storageType === "VERCEL_BLOB") {
        // VERCEL_BLOB can use either Notion URLs or S3 paths (for migration)
        if (data.url.startsWith("https://")) {
          // Must be a Notion URL for VERCEL_BLOB
          try {
            const urlObj = new URL(data.url);
            const hostname = urlObj.hostname;
            const isStandardNotion =
              hostname === "www.notion.so" ||
              hostname === "notion.so" ||
              hostname.endsWith(".notion.site");

            if (isStandardNotion) {
              return true;
            }

            // Check if it's a custom Notion domain
            try {
              return await isCustomNotionDomain(data.url);
            } catch {
              return false;
            }
          } catch {
            return false;
          }
        }
        // Or an S3 path (allowed for migration)
        return /^[a-zA-Z0-9_-]+\/doc_[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+\.[a-zA-Z0-9]+$/.test(
          data.url,
        );
      }
      return false;
    },
    {
      message:
        "Storage type does not match the URL/path format, or missing storage type for non-Notion files",
      path: ["storageType"],
    },
  );

// Webhook file URL validator - only allows trusted external sources for webhooks
export const webhookFileUrlSchema = z
  .string()
  .url("Invalid URL format")
  .refine(
    (url) => {
      // Must use HTTPS
      return url.startsWith("https://");
    },
    {
      message: "Webhook file URL must use HTTPS protocol",
    },
  )
  .refine(
    (url) => {
      // Comprehensive security validation including SSRF protection
      return validateUrlSecurity(url);
    },
    {
      message:
        "Webhook file URL contains invalid characters or targets internal resources",
    },
  );
