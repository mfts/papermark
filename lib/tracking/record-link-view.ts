import { NextRequest, userAgent } from "next/server";

import { geolocation, ipAddress } from "@vercel/functions";

import { recordLinkViewTB } from "@/lib/tinybird";
import { isBot } from "@/lib/utils/user-agent";

import { EU_COUNTRY_CODES } from "../constants";
import { capitalize, getDomainWithoutWWW } from "../utils";
import { LOCALHOST_GEO_DATA, LOCALHOST_IP } from "../utils/geo";

export async function recordLinkView({
  req,
  clickId,
  viewId,
  linkId,
  documentId,
  dataroomId,
}: {
  req: NextRequest;
  clickId: string;
  viewId: string;
  linkId: string;
  documentId?: string;
  dataroomId?: string;
}) {
  const ua = userAgent(req);
  const bot = isBot(ua.ua);

  // don't track clicks from bots
  if (bot) {
    return null;
  }

  const ip = process.env.VERCEL === "1" ? ipAddress(req) : LOCALHOST_IP;

  // const cacheKey = `recordClick:${linkId}:${ip}`;

  // // by default, we deduplicate clicks for a domain + key pair from the same IP address – only record 1 click per hour
  // // here, we check if the clickId is cached in Redis within the last hour
  // const cachedClickId = await redis.get<string>(cacheKey);
  // if (cachedClickId) {
  //   return null;
  // }

  // get continent, region & geolocation data
  // interesting, geolocation().region is Vercel's edge region – NOT the actual region
  // so we use the x-vercel-ip-country-region or geolocation().countryRegion to get the actual region
  const { continent, region } =
    process.env.VERCEL === "1"
      ? {
          continent: req.headers.get("x-vercel-ip-continent"),
          region: geolocation(req).countryRegion,
        }
      : LOCALHOST_GEO_DATA;

  const geo =
    process.env.VERCEL === "1" ? geolocation(req) : LOCALHOST_GEO_DATA;

  const isEuCountry = geo.country && EU_COUNTRY_CODES.includes(geo.country);

  const referer = req.headers.get("referer");
  const refererDomain = referer ? getDomainWithoutWWW(referer) : "(direct)";

  const clickData = {
    timestamp: new Date(Date.now()).toISOString(),
    click_id: clickId,
    view_id: viewId,
    link_id: linkId,
    document_id: documentId || null,
    dataroom_id: dataroomId || null,
    ip_address:
      // only record IP if it's a valid IP and not from a EU country
      typeof ip === "string" && ip.trim().length > 0 && !isEuCountry
        ? ip
        : null,
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
  };

  // record link view in Tinybird
  await recordLinkViewTB(clickData);

  // const [,] = await Promise.all([
  //   // cache the click ID in Redis for 1 hour
  //   // redis.set(cacheKey, clickId, {
  //   //   ex: 60 * 60,
  //   // }),
  // ]);

  return clickData;
}
