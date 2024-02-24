import { match } from "ts-pattern";

import { DocumentStorageType } from "@prisma/client";

import { getS3Client } from "./aws-client";
import { DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { del } from "@vercel/blob";

export type DeleteFileOptions = {
  type: DocumentStorageType;
  data: string; // url for vercel, folderpath for s3
};

export const deleteFile = async ({ type, data }: DeleteFileOptions) => {
  return await match(type)
    .with(DocumentStorageType.S3_PATH, async () =>
      deleteAllFilesFromS3Server(data),
    )
    .with(DocumentStorageType.VERCEL_BLOB, async () =>
      deleteFileFromVercelServer(data),
    )
    .otherwise(() => {
      return;
    });
};

const deleteFileFromVercelServer = async (url: string) => {
  await del(url);
};

const deleteAllFilesFromS3Server = async (data: string) => {
  // get docId from url with starts with "doc_" with regex
  const dataMatch = data.match(/^(.*doc_[^\/]+)\//);
  const folderPath = dataMatch ? dataMatch[1] : data;

  const client = getS3Client();

  try {
    // List all objects in the folder
    const listParams = {
      Bucket: process.env.NEXT_PRIVATE_UPLOAD_BUCKET,
      Prefix: `${folderPath}/`, // Ensure this ends with a slash if it's a folder
    };
    const listedObjects = await client.send(
      new ListObjectsV2Command(listParams),
    );

    if (!listedObjects.Contents) return;
    if (listedObjects.Contents.length === 0) return;

    // Prepare delete parameters
    const deleteParams = {
      Bucket: process.env.NEXT_PRIVATE_UPLOAD_BUCKET,
      Delete: {
        Objects: listedObjects.Contents.map((file) => ({ Key: file.Key })),
      },
    };

    // Delete the objects
    await client.send(new DeleteObjectsCommand(deleteParams));

    if (listedObjects.IsTruncated) {
      // If there are more files than returned in a single request, recurse
      await deleteAllFilesFromS3Server(folderPath);
    }
  } catch (error) {
    console.error("Error deleting files:", error);
  }
};
