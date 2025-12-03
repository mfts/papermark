import type { NextApiRequest, NextApiResponse } from "next";

import { getGeoData, LOCALHOST_GEO_DATA, LOCALHOST_IP } from "@/lib/utils/geo";
import { recordLinkViewTB } from "@/lib/tinybird";
import { isBot, userAgentFromString } from "@/lib/utils/user-agent";
import { EU_COUNTRY_CODES } from "@/lib/constants";
import { capitalize, getDomainWithoutWWW, log } from "@/lib/utils";

type Geo = {
  country?: string;
  city?: string;
  region?: string;
  latitude?: string;
  longitude?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  const {
    linkId,
    documentId,
    viewId,
    linkUrl,
    viewerEmail,
  } = req.body as {
    linkId: string;
    documentId: string;
    viewId: string;
    linkUrl: string;
    viewerEmail?: string;
  };

  if (!linkId || !documentId || !viewId || !linkUrl) {
    res.status(400).json({ message: "Missing required fields" });
    return;
  }

  const geo: Geo =
    process.env.VERCEL === "1" ? getGeoData(req.headers) : LOCALHOST_GEO_DATA;

  const referer = req.headers.referer;
  const ua = userAgentFromString(req.headers["user-agent"] || "");

  const bot = isBot(ua.ua);

  // don't track clicks from bots
  if (bot) {
    return res.status(200).json({ success: true, skipped: true });
  }

  const ip = process.env.VERCEL === "1" 
    ? (Array.isArray(req.headers["x-forwarded-for"]) 
        ? req.headers["x-forwarded-for"][0] 
        : req.headers["x-forwarded-for"]) || req.headers["x-real-ip"] 
    : LOCALHOST_IP;

  // get continent, region & geolocation data
  const { continent, region } =
    process.env.VERCEL === "1"
      ? {
          continent: req.headers["x-vercel-ip-continent"] as string | undefined,
          region: req.headers["x-vercel-ip-country-region"] as string | undefined,
        }
      : LOCALHOST_GEO_DATA;

  const isEuCountry = geo.country && EU_COUNTRY_CODES.includes(geo.country);

  const refererDomain = referer ? getDomainWithoutWWW(referer) : "(direct)";

  const clickId = `click_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const clickData = {
    timestamp: new Date(Date.now()).toISOString(),
    click_id: clickId,
    view_id: viewId,
    link_id: linkId,
    document_id: documentId,
    dataroom_id: null,
    continent: continent || "",
    country: geo.country || "Unknown",
    region: region || "Unknown",
    city: geo.city || "Unknown",
    latitude: geo.latitude || "Unknown",
    longitude: geo.longitude || "Unknown",
    device: ua.device.type ? capitalize(ua.device.type) : "Desktop",
    device_vendor: ua.device.vendor || "Unknown",
    device_model: ua.device.model || "Unknown",
    browser: ua.browser.name || "Unknown",
    browser_version: ua.browser.version || "Unknown",
    engine: ua.engine.name || "Unknown",
    engine_version: ua.engine.version || "Unknown",
    os: ua.os.name || "Unknown",
    os_version: ua.os.version || "Unknown",
    cpu_architecture: ua.cpu?.architecture || "Unknown",
    ua: ua.ua || "Unknown",
    bot: ua.isBot,
    referer: refererDomain,
    referer_url: referer || "(direct)",
    ip_address:
      // only record IP if it's a valid IP and not from a EU country
      typeof ip === "string" && ip.trim().length > 0 && !isEuCountry
        ? ip
        : null,
  };

  // Record link open in Tinybird (notifications/webhooks are handled when view is created)
  try {
    await recordLinkViewTB(clickData);
  } catch (error) {
    log({
      message: `Failed to record link open (tinybird) for ${linkId}. \n\n ${error}`,
      type: "error",
      mention: true,
    });
    // Still return success to not block the redirect
  }

  return res.status(200).json({ success: true });
}

