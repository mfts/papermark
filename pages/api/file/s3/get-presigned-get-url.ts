import { NextApiRequest, NextApiResponse } from "next";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Client } from "@/lib/files/aws-client";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { ONE_HOUR, ONE_SECOND } from "@/lib/constants";

import { getSignedUrl as getCloudfrontSignedUrl } from "@aws-sdk/cloudfront-signer";

const client = getS3Client();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const { key } = req.body as { key: string };

  try {
    if (process.env.NEXT_PRIVATE_UPLOAD_DISTRIBUTION_DOMAIN) {
      const distributionUrl = new URL(
        key,
        `${process.env.NEXT_PRIVATE_UPLOAD_DISTRIBUTION_DOMAIN}`,
      );

      const url = getCloudfrontSignedUrl({
        url: distributionUrl.toString(),
        keyPairId: `${process.env.NEXT_PRIVATE_UPLOAD_DISTRIBUTION_KEY_ID}`,
        privateKey: `${process.env.NEXT_PRIVATE_UPLOAD_DISTRIBUTION_KEY_CONTENTS}`,
        dateLessThan: new Date(Date.now() + ONE_HOUR).toISOString(),
      });

      return res.status(200).json({ url });
    }

    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.NEXT_PRIVATE_UPLOAD_BUCKET,
      Key: key,
    });

    const url = await getS3SignedUrl(client, getObjectCommand, {
      expiresIn: ONE_HOUR / ONE_SECOND,
    });

    return res.status(200).json({ url });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
