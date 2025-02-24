import { NextApiRequest, NextApiResponse } from "next";

import { z } from "zod";

import { EU_COUNTRY_CODES, VIDEO_EVENT_TYPES } from "@/lib/constants";
import { newId } from "@/lib/id-helper";
import { recordVideoView } from "@/lib/tinybird";
import { Geo } from "@/lib/types";
import { capitalize, getDomainWithoutWWW, log } from "@/lib/utils";
import { LOCALHOST_GEO_DATA, getGeoData } from "@/lib/utils/geo";
import { getIpAddress } from "@/lib/utils/ip";
import { userAgentFromString } from "@/lib/utils/user-agent";

const bodyValidation = z.object({
  timestamp: z.string(),
  id: z.string(),
  link_id: z.string(),
  document_id: z.string(),
  view_id: z.string(),
  dataroom_id: z.string().nullable(),
  version_number: z.number(),
  event_type: z.enum(VIDEO_EVENT_TYPES),
  start_time: z.number(),
  end_time: z.number(),
  playback_rate: z.number().transform((rate) => Math.round(rate * 100)), // 1.5 -> 150
  volume: z.number().transform((vol) => Math.round(vol * 100)), // 0.7 -> 70
  is_muted: z.number(),
  is_focused: z.number(),
  is_fullscreen: z.number(),
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
  ip_address: z.string().nullable(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const geo: Geo =
    process.env.VERCEL === "1" ? getGeoData(req.headers) : LOCALHOST_GEO_DATA;
  const isEuCountry = geo.country && EU_COUNTRY_CODES.includes(geo.country);

  // Get user agent data
  const ua = userAgentFromString(req.headers["user-agent"]);
  const referer = req.headers.referer;
  const refererDomain = referer ? getDomainWithoutWWW(referer) : "(direct)";

  const ipAddress = getIpAddress(req.headers);

  const videoViewId = newId("videoView");

  const {
    timestamp,
    linkId,
    documentId,
    viewId,
    dataroomId,
    versionNumber,
    startTime,
    endTime,
    playbackRate,
    volume,
    isMuted,
    isFocused,
    isFullscreen,
    eventType,
  } = req.body as {
    timestamp: string;
    linkId: string;
    documentId: string;
    viewId: string;
    dataroomId: string | null;
    versionNumber: number;
    startTime: number;
    endTime: number | undefined;
    playbackRate: number;
    volume: number;
    isMuted: number;
    isFocused: number;
    isFullscreen: number;
    eventType: string;
  };

  const videoViewObject = {
    timestamp: timestamp,
    id: videoViewId,
    link_id: linkId,
    document_id: documentId,
    view_id: viewId,
    dataroom_id: dataroomId || null,
    version_number: versionNumber || 1,
    event_type: eventType,
    start_time: startTime,
    end_time: endTime,
    playback_rate: playbackRate,
    volume,
    is_muted: isMuted ? 1 : 0,
    is_focused: isFocused ? 1 : 0,
    is_fullscreen: isFullscreen ? 1 : 0,
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
    referer: refererDomain,
    referer_url: referer || "(direct)",
    ip_address:
      // only record IP if it's a valid IP and not from a EU country
      typeof ipAddress === "string" &&
      ipAddress.trim().length > 0 &&
      !isEuCountry
        ? ipAddress
        : null,
  };

  const result = bodyValidation.safeParse(videoViewObject);
  if (!result.success) {
    return res
      .status(400)
      .json({ error: `Invalid body: ${result.error.message}` });
  }

  try {
    await recordVideoView(result.data);
    res.status(200).json({ message: "Video view recorded" });
  } catch (error) {
    log({
      message: `Failed to record video view (tinybird) for ${linkId}. \n\n ${error}`,
      type: "error",
      mention: true,
    });
    res.status(500).json({ error: "Failed to record video view" });
  }
}
