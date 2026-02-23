import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getTeamStorageConfigById } from "@/ee/features/storage/config";

export interface S3KeyInfo {
  bucket: string;
  key: string;
  region: string;
}

const THREE_DAYS_IN_SECONDS = 3 * 24 * 60 * 60;

/**
 * Parse an S3 presigned URL to extract bucket, key, and region.
 * Supports both path-style and virtual-hosted-style URLs.
 *
 * Path-style:    https://s3.{region}.amazonaws.com/{bucket}/{key}
 * Virtual-hosted: https://{bucket}.s3.{region}.amazonaws.com/{key}
 */
export function parseS3PresignedUrl(presignedUrl: string): S3KeyInfo {
  const url = new URL(presignedUrl);
  const hostname = url.hostname;

  // Path-style: s3.{region}.amazonaws.com
  const pathStyleMatch = hostname.match(/^s3\.([^.]+)\.amazonaws\.com$/);
  if (pathStyleMatch) {
    const region = pathStyleMatch[1];
    // Path is /{bucket}/{key...}
    const pathParts = url.pathname.slice(1).split("/");
    const bucket = decodeURIComponent(pathParts[0]);
    const key = pathParts.slice(1).map(decodeURIComponent).join("/");
    return { bucket, key, region };
  }

  // Virtual-hosted-style: {bucket}.s3.{region}.amazonaws.com
  const virtualMatch = hostname.match(/^(.+)\.s3\.([^.]+)\.amazonaws\.com$/);
  if (virtualMatch) {
    const bucket = virtualMatch[1];
    const region = virtualMatch[2];
    const key = decodeURIComponent(url.pathname.slice(1));
    return { bucket, key, region };
  }

  // Virtual-hosted without region: {bucket}.s3.amazonaws.com (us-east-1)
  const virtualNoRegionMatch = hostname.match(/^(.+)\.s3\.amazonaws\.com$/);
  if (virtualNoRegionMatch) {
    const bucket = virtualNoRegionMatch[1];
    const key = decodeURIComponent(url.pathname.slice(1));
    return { bucket: bucket, key, region: "us-east-1" };
  }

  throw new Error(`Unable to parse S3 URL: ${presignedUrl}`);
}

/**
 * Generate a fresh presigned URL for an S3 object using team credentials.
 * Uses long-term IAM credentials which allow presigned URLs up to 7 days.
 */
export async function generateFreshPresignedUrl(
  teamId: string,
  s3Key: S3KeyInfo,
  expiresInSeconds: number = THREE_DAYS_IN_SECONDS,
): Promise<string> {
  const config = await getTeamStorageConfigById(teamId);

  const client = new S3Client({
    region: s3Key.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  const command = new GetObjectCommand({
    Bucket: s3Key.bucket,
    Key: s3Key.key,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(s3Key.key.split("/").pop() || "download.zip")}"`,
    ResponseCacheControl: "no-cache, no-store, must-revalidate",
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}
