import type { NextApiRequest, NextApiResponse } from "next";

import { MultiRegionS3Store } from "@/ee/features/storage/s3-store";
import { CopyObjectCommand } from "@aws-sdk/client-s3";
import { Server } from "@tus/server";
import path from "node:path";

import { verifyDataroomSessionInPagesRouter } from "@/lib/auth/dataroom-auth";
import { getTeamS3ClientAndConfig } from "@/lib/files/aws-client";
import { safeSlugify } from "@/lib/utils";
import { RedisLocker } from "@/lib/files/tus-redis-locker";
import { newId } from "@/lib/id-helper";
import prisma from "@/lib/prisma";
import { lockerRedisClient } from "@/lib/redis";
import { log } from "@/lib/utils";

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: false,
  },
};

const locker = new RedisLocker({
  redisClient: lockerRedisClient,
});

type TusErrorResponse = { status_code: number; body: string };

type ViewerUploadMetadata = {
  teamId?: string;
  fileName?: string;
  viewerId?: string;
  linkId?: string;
  dataroomId?: string;
  [key: string]: string | undefined;
};

const viewerTusDatastore = new MultiRegionS3Store();

const parseTusMetadataHeader = (
  metadataHeader: string | string[] | undefined,
): ViewerUploadMetadata => {
  if (!metadataHeader) {
    throw { status_code: 403, body: "Missing upload metadata" };
  }

  const metadata: ViewerUploadMetadata = {};
  const headerString = Array.isArray(metadataHeader)
    ? metadataHeader[0]
    : metadataHeader;
  headerString.split(",").forEach((item) => {
    const [key, value] = item.trim().split(" ");
    if (!key || !value) {
      return;
    }

    metadata[key] = Buffer.from(value, "base64").toString();
  });

  return metadata;
};

const decodeUploadId = (uploadId: string) =>
  uploadId.includes("/")
    ? uploadId
    : Buffer.from(uploadId, "base64url").toString("utf-8");

const validateViewerDataroomSession = async (
  req: NextApiRequest,
  metadata: Pick<ViewerUploadMetadata, "linkId" | "dataroomId" | "viewerId">,
) => {
  const { linkId, dataroomId, viewerId } = metadata;

  if (!linkId || !dataroomId || !viewerId) {
    throw { status_code: 403, body: "Missing required metadata" };
  }

  const session = await verifyDataroomSessionInPagesRouter(req, linkId, dataroomId);
  if (!session?.viewerId) {
    throw { status_code: 403, body: "Unauthorized" };
  }

  if (session.viewerId !== viewerId) {
    throw { status_code: 403, body: "Invalid viewer" };
  }
};

const tusServer = new Server({
  // `path` needs to match the route declared by the next file router
  path: "/api/file/tus-viewer",
  maxSize: 1024 * 1024 * 1024 * 2, // 2 GiB
  respectForwardedHeaders: true,
  locker,
  datastore: viewerTusDatastore,
  async namingFunction(req, metadata) {
    // Extract viewer data from metadata
    const { teamId, fileName, viewerId, linkId, dataroomId } = metadata as {
      teamId: string;
      fileName: string;
      viewerId: string;
      linkId: string;
      dataroomId: string;
    };

    // Validate the viewer exists and has permission
    let teamIdToUse = teamId;
    try {
      if (teamId !== "visitor-upload") {
        throw new Error("Unauthorized to access this team");
      }

      const link = await prisma.link.findUnique({
        where: {
          id: linkId,
          dataroomId: dataroomId || null,
        },
        select: { teamId: true, enableUpload: true },
      });

      if (!link || !link.enableUpload || !link.teamId) {
        throw new Error("Upload not allowed");
      }

      const viewer = await prisma.viewer.findUnique({
        where: { id: viewerId },
        select: { teamId: true },
      });

      if (!viewer || viewer.teamId !== link.teamId) {
        throw new Error("Unauthorized to access this team");
      }

      teamIdToUse = link.teamId;
    } catch (error) {
      console.error("Error validating viewer:", error);
      throw new Error("Unauthorized");
    }

    const docId = newId("doc");
    const { name, ext } = path.parse(fileName);
    const newName = `${teamIdToUse}/${docId}/${safeSlugify(name)}${ext}`;
    return newName;
  },
  generateUrl(req, { proto, host, path, id }) {
    // Encode the ID to be URL safe
    id = Buffer.from(id, "utf-8").toString("base64url");
    return `${proto}://${host}${path}/${id}`;
  },
  getFileIdFromRequest(req) {
    // Extract the ID from the URL
    const id = (req.url as string).split("/api/file/tus-viewer/")[1];
    return Buffer.from(id, "base64url").toString("utf-8");
  },
  onResponseError(req, res, err) {
    if (typeof err === "object" && err !== null) {
      const tusError = err as { status_code?: unknown; body?: unknown };
      if (
        typeof tusError.status_code === "number" &&
        typeof tusError.body === "string"
      ) {
        const errorResponse: TusErrorResponse = {
          status_code: tusError.status_code,
          body: tusError.body,
        };
        return errorResponse;
      }
    }

    log({
      message: "Error uploading a file via viewer. Error: \n\n" + err,
      type: "error",
    });
    return { status_code: 500, body: "Internal Server Error" };
  },
  async onUploadCreate(req, res, upload) {
    // Extract viewer data from metadata
    const { teamId, fileName, viewerId, linkId, dataroomId } =
      upload.metadata as {
        teamId: string;
        fileName: string;
        viewerId: string;
        dataroomId: string;
        linkId: string;
      };

    // Validate the viewer exists and has permission
    try {
      if (teamId !== "visitor-upload") {
        throw new Error("Unauthorized to access this team");
      }

      const link = await prisma.link.findUnique({
        where: {
          id: linkId,
          dataroomId: dataroomId || null,
        },
        select: { teamId: true, enableUpload: true },
      });

      if (!link || !link.enableUpload || !link.teamId) {
        throw new Error("Upload not allowed");
      }

      const viewer = await prisma.viewer.findUnique({
        where: { id: viewerId },
        select: { teamId: true },
      });

      if (!viewer || viewer.teamId !== link.teamId) {
        throw new Error("Unauthorized to access this team");
      }

      return res;
    } catch (error) {
      console.error("Error validating viewer:", error);
      throw new Error("Unauthorized");
    }
  },
  async onUploadFinish(req, res, upload) {
    try {
      const metadata = upload.metadata || {};
      const contentType = metadata.contentType || "application/octet-stream";
      const { name, ext } = path.parse(metadata.fileName!);
      const originalFileName = `${name}${ext}`;
      const contentDisposition = `attachment; filename="${safeSlugify(name)}${ext}"; filename*=UTF-8''${encodeURIComponent(originalFileName)}`;

      // The Key (object path) where the file was uploaded
      const objectKey = upload.id;

      // Extract teamId from the object key (format: teamId/docId/filename)
      const teamId = objectKey.split("/")[0];
      if (!teamId) {
        throw { status_code: 500, body: "Invalid object key format" };
      }

      // Get team-specific S3 client and config
      const { client, config } = await getTeamS3ClientAndConfig(teamId);

      // Copy the object onto itself, replacing the metadata
      const params = {
        Bucket: config.bucket,
        CopySource: `${config.bucket}/${objectKey}`,
        Key: objectKey,
        ContentType: contentType,
        ContentDisposition: contentDisposition,
        MetadataDirective: "REPLACE" as const,
      };

      const copyCommand = new CopyObjectCommand(params);
      await client.send(copyCommand);

      return res;
    } catch (error) {
      throw { status_code: 500, body: "Error updating metadata" };
    }
  },
  async onIncomingRequest(req, res, uploadId) {
    if (req.method === "POST" && !uploadId) {
      const metadata = parseTusMetadataHeader(req.headers["upload-metadata"]);
      await validateViewerDataroomSession(req as NextApiRequest, {
        linkId: metadata.linkId,
        dataroomId: metadata.dataroomId,
        viewerId: metadata.viewerId,
      });
      return;
    }

    if (!uploadId) {
      throw { status_code: 400, body: "Invalid upload id" };
    }

    const decodedUploadId = decodeUploadId(uploadId);
    const existingUpload = await viewerTusDatastore
      .getUpload(decodedUploadId)
      .catch(() => null);

    if (!existingUpload) {
      throw { status_code: 404, body: "Upload not found" };
    }

    const metadata = (existingUpload.metadata || {}) as ViewerUploadMetadata;
    await validateViewerDataroomSession(req as NextApiRequest, {
      linkId: metadata.linkId,
      dataroomId: metadata.dataroomId,
      viewerId: metadata.viewerId,
    });
  },
});

// CORS headers to allow custom domains
const setCorsHeaders = (req: NextApiRequest, res: NextApiResponse) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, GET, OPTIONS, DELETE, PATCH, HEAD",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Upload-Length, Upload-Metadata, Upload-Offset, Tus-Resumable, Upload-Defer-Length, Upload-Concat",
  );
  res.setHeader(
    "Access-Control-Expose-Headers",
    "Upload-Offset, Location, Upload-Length, Tus-Version, Tus-Resumable, Tus-Max-Size, Tus-Extension, Upload-Metadata, Upload-Defer-Length, Upload-Concat",
  );
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    setCorsHeaders(req, res);
    return res.status(204).end();
  }

  // Set CORS headers for all requests
  setCorsHeaders(req, res);

  // Session validation is enforced in onIncomingRequest.
  return tusServer.handle(req, res);
}
