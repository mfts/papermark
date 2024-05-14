import { NextApiRequest, NextApiResponse } from "next";

import { z } from "zod";

import { newId } from "@/lib/id-helper";
import { publishPageView } from "@/lib/tinybird";
import { Geo } from "@/lib/types";
import { capitalize, getDomainWithoutWWW, log } from "@/lib/utils";
import { LOCALHOST_GEO_DATA, getGeoData } from "@/lib/utils/geo";
import { userAgentFromString } from "@/lib/utils/user-agent";

const bodyValidation = z.object({
  id: z.string(),
  linkId: z.string(),
  documentId: z.string(),
  viewId: z.string(),
  dataroomId: z.string().nullable().optional(),
  versionNumber: z.number().int().optional(),
  time: z.number().int(),
  duration: z.number().int(),
  pageNumber: z.string(),
  country: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  ua: z.string().optional(),
  browser: z.string().optional(),
  browser_version: z.string().optional(),
  engine: z.string().optional(),
  engine_version: z.string().optional(),
  os: z.string().optional(),
  os_version: z.string().optional(),
  device: z.string().optional(),
  device_vendor: z.string().optional(),
  device_model: z.string().optional(),
  cpu_architecture: z.string().optional(),
  bot: z.boolean().optional(),
  referer: z.string().optional(),
  referer_url: z.string().optional(),
});

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // We only allow POST requests
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  const geo: Geo =
    process.env.VERCEL === "1" ? getGeoData(req.headers) : LOCALHOST_GEO_DATA;

  const referer = req.headers.referer;
  const ua = userAgentFromString(req.headers["user-agent"]);

  const {
    linkId,
    documentId,
    viewId,
    dataroomId,
    duration,
    pageNumber,
    versionNumber,
  } = req.body as {
    linkId: string;
    documentId: string;
    viewId: string;
    dataroomId: string | undefined;
    duration: number;
    pageNumber: number;
    versionNumber: number;
  };

  const time = Date.now(); // in milliseconds

  const pageViewId = newId("view");

  const pageViewObject = {
    id: pageViewId,
    linkId,
    documentId,
    viewId,
    dataroomId: dataroomId || null,
    versionNumber: versionNumber || 1,
    time,
    duration,
    pageNumber: pageNumber.toString(),
    country: geo?.country || "Unknown",
    city: geo?.city || "Unknown",
    region: geo?.region || "Unknown",
    latitude: geo?.latitude || "Unknown",
    longitude: geo?.longitude || "Unknown",
    ua: ua.ua || "Unknown",
    browser: ua.browser.name || "Unknown",
    browser_version: ua.browser.version || "Unknown",
    engine: ua.engine.name || "Unknown",
    engine_version: ua.engine.version || "Unknown",
    os: ua.os.name || "Unknown",
    os_version: ua.os.version || "Unknown",
    device: ua.device.type ? capitalize(ua.device.type) : "Desktop",
    device_vendor: ua.device.vendor || "Unknown",
    device_model: ua.device.model || "Unknown",
    cpu_architecture: ua.cpu?.architecture || "Unknown",
    bot: ua.isBot,
    referer: referer ? getDomainWithoutWWW(referer) : "(direct)",
    referer_url: referer || "(direct)",
  };

  const result = bodyValidation.safeParse(pageViewObject);
  if (!result.success) {
    return res
      .status(400)
      .json({ error: `Invalid body: ${result.error.message}` });
  }

  try {
    await publishPageView(result.data);

    res.status(200).json({ message: "View recorded" });
  } catch (error) {
    log({
      message: `Failed to record view (tinybird) for ${linkId}. \n\n ${error}`,
      type: "error",
      mention: true,
    });
    res.status(500).json({ message: (error as Error).message });
  }
}
