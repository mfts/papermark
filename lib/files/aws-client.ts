import { LambdaClient } from "@aws-sdk/client-lambda";
import { S3Client } from "@aws-sdk/client-s3";

export const getS3Client = () => {
  const NEXT_PUBLIC_UPLOAD_TRANSPORT = process.env.NEXT_PUBLIC_UPLOAD_TRANSPORT;

  if (NEXT_PUBLIC_UPLOAD_TRANSPORT !== "s3") {
    throw new Error("Invalid upload transport");
  }

  const hasCredentials =
    process.env.NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID &&
    process.env.NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY;

  return new S3Client({
    endpoint: process.env.NEXT_PRIVATE_UPLOAD_ENDPOINT || undefined,
    region: process.env.NEXT_PRIVATE_UPLOAD_REGION || "eu-central-1",
    credentials: hasCredentials
      ? {
          accessKeyId: String(process.env.NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID),
          secretAccessKey: String(
            process.env.NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY,
          ),
        }
      : undefined,
  });
};

export const getLambdaClient = () => {
  const NEXT_PUBLIC_UPLOAD_TRANSPORT = process.env.NEXT_PUBLIC_UPLOAD_TRANSPORT;

  if (NEXT_PUBLIC_UPLOAD_TRANSPORT !== "s3") {
    throw new Error("Invalid upload transport");
  }

  return new LambdaClient({
    region: process.env.NEXT_PRIVATE_UPLOAD_REGION || "eu-central-1",
    credentials: {
      accessKeyId: String(process.env.NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID),
      secretAccessKey: String(
        process.env.NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY,
      ),
    },
  });
};
