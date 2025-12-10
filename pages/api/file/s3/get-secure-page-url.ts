import { NextApiRequest, NextApiResponse } from "next";

import { DocumentStorageType } from "@prisma/client";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as getCloudfrontSignedUrl } from "@aws-sdk/cloudfront-signer";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";

import { ONE_SECOND } from "@/lib/constants";
import { getTeamS3ClientAndConfig } from "@/lib/files/aws-client";
import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";

// Short-lived URL expiry in seconds (30 seconds)
const SHORT_LIVED_URL_EXPIRY = 30;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const { viewId, linkId, pageNumber, documentVersionId, isPreview } =
    req.body as {
      viewId?: string;
      linkId: string;
      pageNumber: number;
      documentVersionId: string;
      isPreview?: boolean;
    };

  // Validate required fields
  if (!linkId || !pageNumber || !documentVersionId) {
    return res
      .status(400)
      .json({ message: "linkId, pageNumber, and documentVersionId required" });
  }

  // For non-preview requests, viewId is required
  if (!isPreview && !viewId) {
    return res.status(400).json({ message: "viewId is required" });
  }

  try {
    // Verify the view session is valid (unless it's a preview)
    if (!isPreview && viewId) {
      const view = await prisma.view.findUnique({
        where: {
          id: viewId,
          linkId: linkId,
        },
        select: {
          id: true,
          viewedAt: true,
          link: {
            select: {
              isArchived: true,
              deletedAt: true,
              expiresAt: true,
            },
          },
        },
      });

      if (!view) {
        return res.status(404).json({ message: "View session not found" });
      }

      // Check if link is archived
      if (view.link.isArchived) {
        return res.status(403).json({ message: "Link is no longer available" });
      }

      // Check if link is deleted
      if (view.link.deletedAt) {
        return res.status(403).json({ message: "Link has been deleted" });
      }

      // Check if link is expired
      if (view.link.expiresAt && view.link.expiresAt < new Date()) {
        return res.status(403).json({ message: "Link has expired" });
      }

      // View session must be within 24 hours
      const maxViewAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      if (view.viewedAt < new Date(Date.now() - maxViewAge)) {
        return res.status(403).json({ message: "View session has expired" });
      }
    }

    // Fetch the document page
    const documentPage = await prisma.documentPage.findUnique({
      where: {
        pageNumber_versionId: {
          pageNumber: pageNumber,
          versionId: documentVersionId,
        },
      },
      select: {
        file: true,
        storageType: true,
        version: {
          select: {
            document: {
              select: {
                teamId: true,
              },
            },
          },
        },
      },
    });

    if (!documentPage) {
      return res.status(404).json({ message: "Page not found" });
    }

    const teamId = documentPage.version.document.teamId;

    // For Vercel Blob storage, the URL is already accessible
    if (documentPage.storageType === DocumentStorageType.VERCEL_BLOB) {
      return res.status(200).json({ url: documentPage.file });
    }

    // For S3 storage, generate a short-lived signed URL
    if (documentPage.storageType === DocumentStorageType.S3_PATH) {
      const key = documentPage.file;
      const { client, config } = await getTeamS3ClientAndConfig(teamId!);

      let url: string;

      if (config.distributionHost) {
        // Use CloudFront signed URL
        const distributionUrl = new URL(
          key,
          `https://${config.distributionHost}`,
        );

        url = getCloudfrontSignedUrl({
          url: distributionUrl.toString(),
          keyPairId: `${config.distributionKeyId}`,
          privateKey: `${config.distributionKeyContents}`,
          dateLessThan: new Date(
            Date.now() + SHORT_LIVED_URL_EXPIRY * ONE_SECOND,
          ).toISOString(),
        });
      } else {
        // Use S3 presigned URL
        const getObjectCommand = new GetObjectCommand({
          Bucket: config.bucket,
          Key: key,
        });

        url = await getS3SignedUrl(client, getObjectCommand, {
          expiresIn: SHORT_LIVED_URL_EXPIRY,
        });
      }

      return res.status(200).json({
        url,
        expiresIn: SHORT_LIVED_URL_EXPIRY,
      });
    }

    return res.status(400).json({ message: "Invalid storage type" });
  } catch (error) {
    log({
      message: `Error getting secure page URL: ${error}`,
      type: "error",
    });
    return res.status(500).json({ message: "Internal server error" });
  }
}
