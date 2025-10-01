import { NotionAPI } from "notion-client";
import { getPageContentBlockIds, parsePageId } from "notion-utils";

import notion from "./index";

export const addSignedUrls: NotionAPI["addSignedUrls"] = async ({
  recordMap,
  contentBlockIds,
}) => {
  recordMap.signed_urls = {};

  if (!contentBlockIds) {
    contentBlockIds = getPageContentBlockIds(recordMap);
  }

  const allFileInstances = contentBlockIds.flatMap((blockId) => {
    const block = recordMap.block[blockId]?.value;

    if (
      block &&
      (block.type === "pdf" ||
        block.type === "audio" ||
        (block.type === "image" && block.file_ids?.length) ||
        block.type === "video" ||
        block.type === "file" ||
        block.type === "page")
    ) {
      const source =
        block.type === "page"
          ? block.format?.page_cover
          : block.properties?.source?.[0]?.[0];

      if (source) {
        if (
          source.includes("secure.notion-static.com") ||
          source.includes("prod-files-secure") ||
          source.includes("attachment:")
        ) {
          return {
            permissionRecord: {
              table: "block",
              id: block.id,
            },
            url: source,
          };
        }
      }
    }

    return [];
  });

  if (allFileInstances.length > 0) {
    try {
      const { signedUrls } = await notion.getSignedFileUrls(allFileInstances);

      if (signedUrls.length === allFileInstances.length) {
        for (const [i, file] of allFileInstances.entries()) {
          const signedUrl = signedUrls[i];
          if (!signedUrl) continue;

          const blockId = file.permissionRecord.id;
          if (!blockId) continue;

          recordMap.signed_urls[blockId] = signedUrl;
        }
      }
    } catch (err) {
      console.warn("NotionAPI getSignedfileUrls error", err);
    }
  }
};

/**
 * Extracts page ID from custom Notion domain URLs
 * For custom domains, the page ID is typically embedded in the URL slug
 */
export function extractPageIdFromCustomNotionUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Try robust parser first (handles hyphenated and plain IDs)
    const parsed = parsePageId(url) || parsePageId(pathname);
    if (parsed) return parsed;

    // Fallback: match either plain 32-hex or hyphenated UUID-like Notion ID
    const pageIdMatch = pathname.match(
      /\b(?:[a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\b/i,
    );
    if (pageIdMatch) return parsePageId(pageIdMatch[0]) ?? pageIdMatch[0];

    return null;
  } catch {
    return null;
  }
}

/**
 * Check if a URL is potentially a custom Notion domain by attempting to extract a page ID
 * and verifying the page exists
 */
export async function isCustomNotionDomain(url: string): Promise<boolean> {
  try {
    const pageId = extractPageIdFromCustomNotionUrl(url);
    if (!pageId) {
      return false;
    }

    // Try to fetch the page to verify it exists and is accessible
    await notion.getPage(pageId);
    return true;
  } catch {
    return false;
  }
}

export async function getNotionPageIdFromSlug(
  url: string,
): Promise<string | null> {
  // Parse the URL to extract domain and slug
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;

  const isNotionSo = hostname === "www.notion.so" || hostname === "notion.so";
  const isNotionSite = hostname.endsWith(".notion.site");

  // notion.so: extract ID from path directly
  if (isNotionSo) {
    const pageId = parsePageId(url) ?? parsePageId(urlObj.pathname);
    if (pageId) return pageId;
    throw new Error(`Unable to extract page ID from Notion URL: ${url}`);
  }

  // Custom domains (non notion.site, non notion.so)
  if (!isNotionSite) {
    const pageId = extractPageIdFromCustomNotionUrl(url);
    if (pageId) {
      // Verify the page exists before returning the ID
      try {
        await notion.getPage(pageId);
        return pageId;
      } catch {
        throw new Error(`Custom Notion domain page not accessible: ${url}`);
      }
    }
    throw new Error(`Unable to extract page ID from custom domain URL: ${url}`);
  }

  // Extract domain from hostname (e.g., "domain" from "domain.notion.site")
  const domainMatch = hostname.match(/^([^.]+)\.notion\.site$/);
  if (!domainMatch) {
    throw new Error(`Invalid Notion site URL format: ${url}`);
  }

  const spaceDomain = domainMatch[1];

  // Extract slug from pathname (remove leading slash)
  // If slug is missing, we will try to get page just by using spaceDomain
  let slug = urlObj.pathname.substring(1) || "";

  // Make request to Notion's internal API
  const apiUrl = `https://${spaceDomain}.notion.site/api/v3/getPublicPageDataForDomain`;
  const payload = {
    type: "block-space",
    name: "page",
    slug: slug,
    spaceDomain: spaceDomain,
    requestedOnPublicDomain: true,
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; MyApp/1.0)",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      `Notion API request failed: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();

  if (data.pageId) {
    return data.pageId;
  } else {
    throw new Error("No pageId found in Notion API response");
  }
}
