import { NextApiRequest, NextApiResponse } from "next";

import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import slugify from "@sindresorhus/slugify";
import { getServerSession } from "next-auth";
import path from "node:path";

import { ONE_HOUR, ONE_SECOND } from "@/lib/constants";
import { getTeamS3ClientAndConfig } from "@/lib/files/aws-client";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  try {
    const {
      action,
      fileName,
      contentType,
      teamId,
      docId,
      uploadId,
      fileSize,
      partSize = 10 * 1024 * 1024, // Default 10MB chunks
      parts,
    } = req.body as {
      action: "initiate" | "get-part-urls" | "complete";
      fileName: string;
      contentType: string;
      teamId: string;
      docId: string;
      uploadId?: string;
      fileSize?: number;
      partSize?: number;
      parts?: Array<{ ETag: string; PartNumber: number }>;
    };

    // Verify team access
    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
        users: {
          some: {
            userId: (session.user as CustomUser).id,
          },
        },
      },
      select: { id: true },
    });

    if (!team) {
      return res.status(403).end("Unauthorized to access this team");
    }

    // Get the basename and extension for the file
    const { name, ext } = path.parse(fileName);
    const slugifiedName = slugify(name) + ext;
    const key = `${team.id}/${docId}/${slugifiedName}`;

    const { client, config } = await getTeamS3ClientAndConfig(team.id);

    switch (action) {
      case "initiate": {
        // Step 1: Start multipart upload
        const createCommand = new CreateMultipartUploadCommand({
          Bucket: config.bucket,
          Key: key,
          ContentType: contentType,
          ContentDisposition: `attachment; filename="${slugifiedName}"`,
        });

        const createResponse = await client.send(createCommand);

        return res.status(200).json({
          uploadId: createResponse.UploadId,
          key,
          fileName: slugifiedName,
        });
      }

      case "get-part-urls": {
        // Step 2: Generate pre-signed URLs for each part
        if (!uploadId || !fileSize) {
          return res.status(400).json({
            error: "uploadId and fileSize are required for get-part-urls action",
          });
        }

        const numParts = Math.ceil(fileSize / partSize);
        const urls = await Promise.all(
          Array.from({ length: numParts }, async (_, index) => {
            const partNumber = index + 1;
            const command = new UploadPartCommand({
              Bucket: config.bucket,
              Key: key,
              PartNumber: partNumber,
              UploadId: uploadId,
            });

            const url = await getSignedUrl(client, command, {
              expiresIn: ONE_HOUR / ONE_SECOND,
            });

            return { partNumber, url };
          }),
        );

        return res.status(200).json({ urls });
      }

      case "complete": {
        // Step 3: Complete multipart upload
        if (!uploadId || !parts) {
          return res.status(400).json({
            error: "uploadId and parts are required for complete action",
          });
        }

        const completeCommand = new CompleteMultipartUploadCommand({
          Bucket: config.bucket,
          Key: key,
          UploadId: uploadId,
          MultipartUpload: {
            Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber),
          },
        });

        await client.send(completeCommand);

        return res.status(200).json({
          success: true,
          key,
          fileName: slugifiedName,
        });
      }

      default:
        return res.status(400).json({ error: "Invalid action" });
    }
  } catch (error) {
    console.error("Multipart upload error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}