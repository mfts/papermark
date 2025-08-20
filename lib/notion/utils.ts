import { NotionAPI } from "notion-client";
import { getPageContentBlockIds } from "notion-utils";

import notion from "./index";

export const addSignedUrls: NotionAPI["addSignedUrls"] = async ({
  recordMap,
  contentBlockIds,
  kyOptions,
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
      const { signedUrls } = await notion.getSignedFileUrls(
        allFileInstances,
        kyOptions,
      );

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

export async function getNotionPageIdFromSlug(url: string) {
  // Parse the URL to extract domain and slug
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;

  // Extract domain from hostname (e.g., "domain" from "domain.notion.site")
  const domainMatch = hostname.match(/^([^.]+)\.notion\.site$/);
  if (!domainMatch) {
    throw new Error("Invalid Notion site URL format: ${url}");
  }

  const spaceDomain = domainMatch[1];

  // Extract slug from pathname (remove leading slash)
  // If slug is missing, we will try to get page just by using spaceDomain
  let slug = urlObj.pathname.substring(1) || "";

  // Make request to Notion's internal API
  const apiUrl =
    "https://${spaceDomain}.notion.site/api/v3/getPublicPageDataForDomain";
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
      "Notion API request failed: ${response.status} ${response.statusText}",
    );
  }

  const data = await response.json();

  if (data.pageId) {
    return data.pageId;
  } else {
    throw new Error("No pageId found in Notion API response");
  }
}
