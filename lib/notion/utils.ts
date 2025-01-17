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
          source.includes("prod-files-secure")
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
