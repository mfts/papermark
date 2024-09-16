import { CopyObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { DocumentStorageType } from "@prisma/client";
import { match } from "ts-pattern";

import { getS3Client } from "./aws-client";

export const copyFileToBucketServer = async ({
  filePath,
  storageType,
}: {
  filePath: string;
  storageType: DocumentStorageType;
}) => {
  const { type, data } = await match(storageType)
    .with("S3_PATH", async () => copyFileToBucketInS3Server({ filePath }))
    .otherwise(() => {
      return {
        type: null,
        data: null,
      };
    });

  return { type, data };
};

const copyFileToBucketInS3Server = async ({
  filePath,
}: {
  filePath: string;
}) => {
  const client = getS3Client();
  const fromBucket = process.env.NEXT_PRIVATE_UPLOAD_BUCKET as string;
  const toBucket = process.env.NEXT_PRIVATE_ADVANCED_UPLOAD_BUCKET as string;

  try {
    const copyCommand = new CopyObjectCommand({
      CopySource: `${fromBucket}/${filePath}`,
      Bucket: toBucket,
      Key: filePath,
    });

    await client.send(copyCommand);

    return {
      type: DocumentStorageType.S3_PATH,
      data: filePath,
    };
  } catch (error) {
    console.error(error);
    return {
      type: null,
      data: null,
    };
  }
};
