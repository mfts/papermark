import type { NextApiRequest, NextApiResponse } from "next";

import { MultiRegionS3Store } from "@/ee/features/storage/s3-store";
import { getLimits } from "@/ee/limits/server";
import { CopyObjectCommand } from "@aws-sdk/client-s3";
import { Server } from "@tus/server";
import { getServerSession } from "next-auth/next";
import path from "node:path";

import { getTeamS3ClientAndConfig } from "@/lib/files/aws-client";
import { RedisLocker } from "@/lib/files/tus-redis-locker";
import { newId } from "@/lib/id-helper";
import prisma from "@/lib/prisma";
import { lockerRedisClient } from "@/lib/redis";
import { CustomUser } from "@/lib/types";
import { log, safeSlugify } from "@/lib/utils";

import { authOptions } from "../../auth/[...nextauth]";

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: false,
  },
};

const locker = new RedisLocker({
  redisClient: lockerRedisClient,
});

const tusServer = new Server({
  // `path` needs to match the route declared by the next file router
  path: "/api/file/tus",
  maxSize: 1024 * 1024 * 1024 * 2, // 2 GiB
  respectForwardedHeaders: true,
  locker,
  datastore: new MultiRegionS3Store(),
  namingFunction(req, metadata) {
    const { teamId, fileName } = metadata as {
      teamId: string;
      fileName: string;
    };
    const docId = newId("doc");
    const { name, ext } = path.parse(fileName);
    const newName = `${teamId}/${docId}/${safeSlugify(name)}${ext}`;
    return newName;
  },
  generateUrl(req, { proto, host, path, id }) {
    // Encode the ID to be URL safe
    id = Buffer.from(id, "utf-8").toString("base64url");
    return `${proto}://${host}${path}/${id}`;
  },
  getFileIdFromRequest(req) {
    // Extract the ID from the URL
    const id = (req.url as string).split("/api/file/tus/")[1];
    return Buffer.from(id, "base64url").toString("utf-8");
  },
  onResponseError(req, res, err) {
    log({
      message: "Error uploading a file. Error: \n\n" + err,
      type: "error",
    });
    return { status_code: 500, body: "Internal Server Error" };
  },
  async onUploadCreate(req, res, upload) {
    const userId = (req as any).__userId as string | undefined;
    if (!userId) {
      throw { status_code: 401, body: "Unauthorized" };
    }

    const metadata = upload.metadata || {};
    const teamId = metadata.teamId;
    if (!teamId) {
      throw { status_code: 400, body: "Missing teamId in upload metadata" };
    }

    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
        users: {
          some: {
            userId,
          },
        },
      },
      select: { id: true },
    });

    if (!team) {
      throw { status_code: 403, body: "Unauthorized to access this team" };
    }

    const limits = await getLimits({ teamId, userId });
    if (
      limits &&
      limits.documents != null &&
      limits.documents !== Infinity &&
      limits.usage.documents >= limits.documents
    ) {
      throw {
        status_code: 403,
        body: "You have reached the document upload limit for your team's plan",
      };
    }

    return res;
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
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = (session.user as CustomUser).id;

  // For PATCH/HEAD/DELETE on existing uploads, validate team membership
  // by extracting the teamId from the file ID encoded in the URL
  const fileIdSegment = req.url?.split("/api/file/tus/")[1]?.split("?")[0];
  if (fileIdSegment) {
    try {
      const fileId = Buffer.from(fileIdSegment, "base64url").toString("utf-8");
      const teamId = fileId.split("/")[0];
      if (teamId) {
        const team = await prisma.team.findUnique({
          where: {
            id: teamId,
            users: {
              some: {
                userId,
              },
            },
          },
          select: { id: true },
        });

        if (!team) {
          return res
            .status(403)
            .json({ message: "Unauthorized to access this team" });
        }
      }
    } catch {
      return res.status(400).json({ message: "Invalid upload ID" });
    }
  }

  (req as any).__userId = userId;

  return tusServer.handle(req, res);
}
