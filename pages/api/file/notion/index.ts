import { NextApiRequest, NextApiResponse } from "next";

import notion from "@/lib/notion";
import {
  addSignedUrls,
  fetchMissingPageReferences,
  normalizeRecordMap,
} from "@/lib/notion/utils";
import { log } from "@/lib/utils";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // We only allow POST requests
  if (req.method !== "POST") {
    await log({
      message: `Method Not Allowed: ${req.method}`,
      type: "error",
    });

    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  // POST /api/file/notion

  const { pageId } = req.body as { pageId: string };

  try {
    const recordMap = await notion.getPage(pageId, { signFileUrls: false });

    if (!recordMap) {
      res.status(500).json({ message: "Internal Server Error" });
      return;
    }

    // Fetch missing page references that are embedded in rich text (e.g., table cells with multiple page links)
    await fetchMissingPageReferences(recordMap);

    // Normalize double-nested block structures from the Notion API
    normalizeRecordMap(recordMap);

    // TODO: separately sign the file urls until PR merged and published; ref: https://github.com/NotionX/react-notion-x/issues/580#issuecomment-2542823817
    await addSignedUrls({ recordMap });

    res.status(200).json(recordMap);
    return;
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
    return;
  }
}
