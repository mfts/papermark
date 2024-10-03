import { NextApiRequest, NextApiResponse } from "next";

import notion from "@/lib/notion";
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
    const recordMap = await notion.getPage(pageId);

    if (!recordMap) {
      res.status(500).json({ message: "Internal Server Error" });
      return;
    }

    res.status(200).json(recordMap);
    return;
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
    return;
  }
}
