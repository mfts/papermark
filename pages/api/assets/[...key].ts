import type { NextApiRequest, NextApiResponse } from "next";

import type { Readable } from "node:stream";

import {
  PUBLIC_ASSET_MAX_AGE_SECONDS,
  getPublicAssetObject,
  isS3PublicAssetStorage,
  parsePublicAssetKey,
} from "@/lib/files/public-assets";

/**
 * Serves public assets (brand logos, banners, link preview images) out of the
 * private object store.
 *
 * Intentionally unauthenticated: these are embedded in public share pages,
 * `og:image` tags, and emails, so search engines, social crawlers, and mail
 * clients all have to be able to fetch them.
 *
 * The bucket is separate from document storage, and keys are validated against
 * a strict allow-list, so this route cannot be walked into document content.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return res.status(405).end("Method Not Allowed");
  }

  if (!isS3PublicAssetStorage()) {
    return res.status(404).end("Not Found");
  }

  const segments = Array.isArray(req.query.key)
    ? req.query.key
    : [req.query.key].filter((segment): segment is string => !!segment);

  const key = parsePublicAssetKey(segments);
  if (!key) {
    return res.status(404).end("Not Found");
  }

  try {
    const object = await getPublicAssetObject(key);
    if (!object?.body) {
      return res.status(404).end("Not Found");
    }

    res.setHeader(
      "Content-Type",
      object.contentType || "application/octet-stream",
    );
    res.setHeader(
      "Cache-Control",
      `public, max-age=${PUBLIC_ASSET_MAX_AGE_SECONDS}, immutable`,
    );
    if (object.contentLength) {
      res.setHeader("Content-Length", String(object.contentLength));
    }
    if (object.etag) {
      res.setHeader("ETag", object.etag);
    }

    if (req.method === "HEAD") {
      return res.status(200).end();
    }

    const stream = object.body as Readable;
    stream.on("error", () => res.destroy());
    return stream.pipe(res);
  } catch (error) {
    // Missing keys surface as NoSuchKey/NotFound from S3.
    return res.status(404).end("Not Found");
  }
}
