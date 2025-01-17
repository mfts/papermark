import { NextApiRequest, NextApiResponse } from "next";

import { z } from "zod";

import { newId } from "@/lib/id-helper";
import { recordClickEvent } from "@/lib/tinybird";
import { log } from "@/lib/utils";

const bodyValidation = z.object({
  timestamp: z.string(),
  event_id: z.string(),
  session_id: z.string(),
  link_id: z.string(),
  document_id: z.string(),
  view_id: z.string(),
  page_number: z.string(),
  href: z.string(),
  version_number: z.number(),
  dataroom_id: z.string().nullable(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const {
    timestamp,
    sessionId,
    linkId,
    documentId,
    viewId,
    pageNumber,
    href,
    versionNumber,
    dataroomId,
  } = req.body as {
    timestamp: string;
    sessionId: string;
    linkId: string;
    documentId: string;
    viewId: string;
    pageNumber: string;
    href: string;
    versionNumber: number;
    dataroomId: string | null;
  };

  const clickEventId = newId("clickEvent");

  const clickEventObject = {
    timestamp: timestamp,
    event_id: clickEventId,
    session_id: sessionId,
    link_id: linkId,
    document_id: documentId,
    view_id: viewId,
    page_number: pageNumber,
    href: href,
    version_number: versionNumber || 1,
    dataroom_id: dataroomId || null,
  };

  const result = bodyValidation.safeParse(clickEventObject);
  if (!result.success) {
    return res
      .status(400)
      .json({ error: `Invalid body: ${result.error.message}` });
  }

  try {
    await recordClickEvent(result.data);
    res.status(200).json({ message: "Click event recorded" });
  } catch (error) {
    log({
      message: `Failed to record click event (tinybird) for ${linkId}. \n\n ${error}`,
      type: "error",
      mention: true,
    });
    res.status(500).json({ error: "Failed to record click event" });
  }
}
