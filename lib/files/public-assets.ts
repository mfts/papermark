import { getStorageConfig } from "@/ee/features/storage/config";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { del, put } from "@vercel/blob";

import { nanoid } from "@/lib/utils";

/**
 * Storage for *public* assets — brand logos, banners, link preview images.
 *
 * These differ from document content in two ways that rule out the presigned
 * URL flow used elsewhere: they are embedded in `og:image` tags and email
 * templates, so the URLs must be absolute and must not expire.
 *
 * Two backends are supported:
 *
 *   * S3-compatible storage (including the MinIO container in
 *     docker-compose.yml) when `NEXT_PRIVATE_PUBLIC_BUCKET` is set. The bucket
 *     stays private; `/api/assets/[...key]` proxies reads, so the storage host
 *     never has to be publicly reachable.
 *   * Vercel Blob otherwise — the historical behaviour, kept so existing
 *     deployments keep working untouched.
 *
 * Previously uploaded Vercel Blob URLs are absolute and stored in the
 * database, so they keep resolving after a switch. No migration is required.
 */

export const PUBLIC_ASSET_ROUTE = "/api/assets";

/** Cache lifetime for proxied assets. Safe because every key is unique. */
export const PUBLIC_ASSET_MAX_AGE_SECONDS = 31_536_000; // 1 year

const getPublicBucket = () => {
  if (process.env.NEXT_PUBLIC_UPLOAD_TRANSPORT !== "s3") return undefined;
  return getStorageConfig().publicBucket || undefined;
};

/** True when public assets are served from S3 rather than Vercel Blob. */
export const isS3PublicAssetStorage = () => !!getPublicBucket();

const getPublicAssetClient = () => {
  const config = getStorageConfig();

  return new S3Client({
    endpoint: config.endpoint || undefined,
    forcePathStyle: config.forcePathStyle,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
};

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "";

/**
 * Object keys are user-influenced, so keep them to a strict allow-list. This
 * is the primary defence for the public proxy route: no slashes, no dots, no
 * traversal — a flat namespace of `<slug>-<nanoid>.<ext>` names.
 */
/** Upload types map to storage prefixes; "assets" becomes "brand" so URLs
 * read /api/assets/brand/... rather than /api/assets/assets/... */
const STORAGE_PREFIX = { profile: "profile", assets: "brand" } as const;

const buildAssetKey = (filename: string, uploadType: "profile" | "assets") => {
  const prefix = STORAGE_PREFIX[uploadType];
  const lastDot = filename.lastIndexOf(".");
  const rawName = lastDot > 0 ? filename.slice(0, lastDot) : filename;
  const rawExt = lastDot > 0 ? filename.slice(lastDot + 1) : "";

  const name =
    rawName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "asset";
  const ext = rawExt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8);

  return `${prefix}/${name}-${nanoid()}${ext ? `.${ext}` : ""}`;
};

/**
 * Validates a key taken from a request path before it reaches S3.
 * Returns null for anything that is not a key this module could have created.
 */
export const parsePublicAssetKey = (segments: string[]): string | null => {
  if (segments.length !== 2) return null;

  const [prefix, name] = segments;
  if (prefix !== "profile" && prefix !== "brand") return null;
  // nanoid() is mixed-case, so uppercase must be allowed here.
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(name)) return null;
  if (name.includes("..")) return null;

  return `${prefix}/${name}`;
};

/**
 * Stores a public asset and returns an absolute, non-expiring URL.
 */
export const putPublicAsset = async ({
  filename,
  contentType,
  body,
  uploadType = "assets",
}: {
  filename: string;
  contentType: string;
  body: Buffer;
  uploadType?: "profile" | "assets";
}): Promise<string> => {
  const bucket = getPublicBucket();

  if (!bucket) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error(
        "Public asset storage is not configured. Set NEXT_PRIVATE_PUBLIC_BUCKET " +
          "to store brand assets in S3, or BLOB_READ_WRITE_TOKEN to use Vercel Blob.",
      );
    }

    const blob = await put(filename, body, {
      access: "public",
      addRandomSuffix: true,
      contentType,
    });
    return blob.url;
  }

  const key = buildAssetKey(filename, uploadType);

  await getPublicAssetClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: `public, max-age=${PUBLIC_ASSET_MAX_AGE_SECONDS}, immutable`,
    }),
  );

  // Absolute: these URLs end up in og:image tags and email templates, where
  // relative paths do not resolve.
  return `${getBaseUrl()}${PUBLIC_ASSET_ROUTE}/${key}`;
};

/**
 * Reads a public asset back out of S3 for the proxy route.
 * Callers must pass a key that came from parsePublicAssetKey.
 */
export const getPublicAssetObject = async (key: string) => {
  const bucket = getPublicBucket();
  if (!bucket) return null;

  const response = await getPublicAssetClient().send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );

  return {
    body: response.Body,
    contentType: response.ContentType,
    contentLength: response.ContentLength,
    etag: response.ETag,
  };
};

/** True for URLs this module produced via the S3 proxy route. */
export const isProxiedPublicAssetUrl = (url: string) =>
  url.startsWith(`${PUBLIC_ASSET_ROUTE}/`) ||
  url.includes(`${PUBLIC_ASSET_ROUTE}/`);

/**
 * Deletes a previously stored public asset, whichever backend produced it.
 * Best-effort: a failure here should never block the request that triggered it.
 */
export const deletePublicAsset = async (
  url: string | null | undefined,
): Promise<void> => {
  if (!url || url === "no-banner" || url.startsWith("data:")) return;

  try {
    if (isProxiedPublicAssetUrl(url)) {
      const bucket = getPublicBucket();
      if (!bucket) return;

      const path = url.slice(url.indexOf(`${PUBLIC_ASSET_ROUTE}/`));
      const segments = path
        .slice(`${PUBLIC_ASSET_ROUTE}/`.length)
        .split("?")[0]
        .split("/");
      const key = parsePublicAssetKey(segments);
      if (!key) return;

      await getPublicAssetClient().send(
        new DeleteObjectCommand({ Bucket: bucket, Key: key }),
      );
      return;
    }

    // Relative paths that are not ours are bundled static files — never delete.
    if (url.startsWith("/")) return;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      await del(url);
    }
  } catch {
    // Orphaned assets are preferable to a failed settings save.
  }
};
