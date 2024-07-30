import { NextApiRequest, NextApiResponse } from "next";

import {
  InvocationType,
  InvokeCommand,
  LambdaClient,
} from "@aws-sdk/client-lambda";
import { ViewType } from "@prisma/client";
import archiver from "archiver";
import mime from "mime-types";

import { getS3Client } from "@/lib/files/aws-client";
import { S3DownloadService } from "@/lib/files/bulk-download";
import { getFile } from "@/lib/files/get-file";
import prisma from "@/lib/prisma";
import {
  getExtensionFromSupportedType,
  getMimeTypeFromSupportedType,
} from "@/lib/utils/get-content-type";

export const config = {
  maxDuration: 180,
};

const s3Client = getS3Client();
const s3Service = new S3DownloadService(s3Client);

const finalizeArchiveSafely = (archive: archiver.Archiver): Promise<void> => {
  return new Promise((resolve, reject) => {
    archive.on("error", reject);
    archive.finalize().then(resolve).catch(reject);
  });
};

const sanitizeFileName = (name: string, mimeType: string): string => {
  // Replace newlines and other potentially problematic characters
  let sanitized = name.replace(/[\n\r\\\/]/g, "_");

  // Add correct extension if it doesn't exist
  const extension = mime.extension(getMimeTypeFromSupportedType(mimeType)!);
  if (extension && !sanitized.endsWith(`.${extension}`)) {
    sanitized += `.${extension}`;
  }

  return sanitized;
};

const generateUniqueFileName = (
  name: string,
  existingNames: Set<string>,
): string => {
  let uniqueName = name;
  let counter = 1;

  while (existingNames.has(uniqueName)) {
    const nameParts = name.split(".");
    if (nameParts.length > 1) {
      const ext = nameParts.pop();
      uniqueName = `${nameParts.join(".")} (${counter}).${ext}`;
    } else {
      uniqueName = `${name}_${counter}`;
    }
    counter++;
  }

  existingNames.add(uniqueName);
  return uniqueName;
};

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // GET /api/links/download/bulk
    const { linkId, viewId } = req.body as { linkId: string; viewId: string };

    try {
      const view = await prisma.view.findUnique({
        where: {
          id: viewId,
          linkId: linkId,
          viewType: { equals: ViewType.DATAROOM_VIEW },
        },
        select: {
          id: true,
          viewedAt: true,
          link: {
            select: {
              allowDownload: true,
              expiresAt: true,
              isArchived: true,
            },
          },
          dataroom: {
            select: {
              documents: {
                select: {
                  document: {
                    select: {
                      name: true,
                      versions: {
                        where: { isPrimary: true },
                        select: {
                          type: true,
                          file: true,
                          storageType: true,
                        },
                        take: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      // if view does not exist, we should not allow the download
      if (!view) {
        return res.status(404).json({ error: "Error downloading" });
      }

      // if link does not allow download, we should not allow the download
      if (!view.link.allowDownload) {
        return res.status(403).json({ error: "Error downloading" });
      }

      // if link is archived, we should not allow the download
      if (view.link.isArchived) {
        return res.status(403).json({ error: "Error downloading" });
      }

      // if link is expired, we should not allow the download
      if (view.link.expiresAt && view.link.expiresAt < new Date()) {
        return res.status(403).json({ error: "Error downloading" });
      }

      // if dataroom does not exist, we should not allow the download
      if (!view.dataroom) {
        return res.status(404).json({ error: "Error downloading" });
      }

      // if viewedAt is longer than 30 mins ago, we should not allow the download
      if (
        view.viewedAt &&
        view.viewedAt < new Date(Date.now() - 30 * 60 * 1000)
      ) {
        return res.status(403).json({ error: "Error downloading" });
      }

      // update the view with the downloadedAt timestamp
      await prisma.view.update({
        where: { id: viewId },
        data: { downloadedAt: new Date() },
      });

      const fileKeysOnly = view.dataroom.documents
        .filter((doc) => doc.document.versions[0].type !== "notion")
        .filter((doc) => doc.document.versions[0].storageType !== "VERCEL_BLOB")
        .map((doc) => {
          return doc.document.versions[0].file;
        });

      const client = new LambdaClient({
        region: process.env.NEXT_PRIVATE_UPLOAD_REGION || "eu-central-1",
        credentials: {
          accessKeyId: String(process.env.NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID),
          secretAccessKey: String(
            process.env.NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY,
          ),
        },
      });

      const params = {
        FunctionName: "bulk-download-zip-creator-prod", // Use the name you gave your Lambda function
        InvocationType: InvocationType.RequestResponse,
        Payload: JSON.stringify({
          sourceBucket: process.env.NEXT_PRIVATE_UPLOAD_BUCKET,
          fileKeys: fileKeysOnly,
        }),
      };

      try {
        const command = new InvokeCommand(params);
        const response = await client.send(command);

        if (response.Payload) {
          const decodedPayload = new TextDecoder().decode(response.Payload);

          const payload = JSON.parse(decodedPayload);
          const { downloadUrl } = JSON.parse(payload.body);

          res.status(200).json({ downloadUrl });
        } else {
          throw new Error("Payload is undefined or empty");
        }
      } catch (error) {
        console.error("Error invoking Lambda:", error);
        res.status(500).json({
          error: "Failed to generate download link",
          details: (error as Error).message,
        });
      }
    } catch (error) {
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
