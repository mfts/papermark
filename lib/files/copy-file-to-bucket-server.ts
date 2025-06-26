import { CopyObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { DocumentStorageType } from "@prisma/client";
import { match } from "ts-pattern";

import { getTeamS3ClientAndConfig } from "./aws-client";

export const copyFileToBucketServer = async ({
  filePath,
  storageType,
  teamId,
}: {
  filePath: string;
  storageType: DocumentStorageType;
  teamId: string;
}) => {
  const { type, data } = await match(storageType)
    .with("S3_PATH", async () =>
      copyFileToBucketInS3Server({ filePath, teamId }),
    )
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
  teamId,
}: {
  filePath: string;
  teamId: string;
}) => {
  const { client, config } = await getTeamS3ClientAndConfig(teamId);

  try {
    const copyCommand = new CopyObjectCommand({
      CopySource: `${config.bucket}/${filePath}`,
      Bucket: config.advancedBucket,
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
