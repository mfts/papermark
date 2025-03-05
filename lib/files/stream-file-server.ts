import { Upload } from "@aws-sdk/lib-storage";
import { DocumentStorageType } from "@prisma/client";
import slugify from "@sindresorhus/slugify";
import path from "node:path";
import { Readable } from "stream";

import { getS3Client } from "./aws-client";

type StreamFile = {
  name: string;
  type: string;
  stream: Readable;
};

export const streamFileServer = async ({
  file,
  teamId,
  docId,
}: {
  file: StreamFile;
  teamId: string;
  docId: string;
}) => {
  const client = getS3Client();

  // Get the basename and extension for the file
  const { name, ext } = path.parse(file.name);

  const key = `${teamId}/${docId}/${slugify(name)}${ext}`;

  const params = {
    client,
    params: {
      Bucket: process.env.NEXT_PRIVATE_UPLOAD_BUCKET,
      Key: key,
      Body: file.stream,
      ContentType: file.type,
    },
  };

  // Use Upload for multipart upload support
  const upload = new Upload(params);

  // Send the upload to S3
  await upload.done();

  return {
    type: DocumentStorageType.S3_PATH,
    data: key,
  };
};
