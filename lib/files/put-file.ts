import { match } from "ts-pattern";
import { upload } from "@vercel/blob/client";

import { DocumentStorageType } from "@prisma/client";
import { getPagesCount } from "@/lib/utils/get-page-number-count";
import { newId } from "@/lib/id-helper";

// type File = {
//   name: string;
//   type: string;
//   arrayBuffer: () => Promise<ArrayBuffer>;
// };

export const putFile = async ({
  file,
  teamId,
  docId,
}: {
  file: File;
  teamId: string;
  docId?: string;
}) => {
  const NEXT_PUBLIC_UPLOAD_TRANSPORT = process.env.NEXT_PUBLIC_UPLOAD_TRANSPORT;

  const { type, data, numPages } = await match(NEXT_PUBLIC_UPLOAD_TRANSPORT)
    .with("s3", async () => putFileInS3({ file, teamId, docId }))
    .with("vercel", async () => putFileInVercel(file))
    .otherwise(() => {
      return {
        type: null,
        data: null,
        numPages: undefined,
      };
    });

  return { type, data, numPages };
};

const putFileInVercel = async (file: File) => {
  const contents = await file.arrayBuffer();
  const numPages = await getPagesCount(contents);

  const newBlob = await upload(file.name, file, {
    access: "public",
    handleUploadUrl: "/api/file/browser-upload",
  });

  return {
    type: DocumentStorageType.VERCEL_BLOB,
    data: newBlob.url,
    numPages: numPages,
  };
};

const putFileInS3 = async ({
  file,
  teamId,
  docId,
}: {
  file: File;
  teamId: string;
  docId?: string;
}) => {
  if (!docId) {
    docId = newId("doc");
  }
  const presignedResponse = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/file/s3/get-presigned-post-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        teamId: teamId,
        docId: docId,
      }),
    },
  );

  if (!presignedResponse.ok) {
    throw new Error(
      `Failed to get presigned post url, failed with status code ${presignedResponse.status}`,
    );
  }

  const { url, key } = (await presignedResponse.json()) as {
    url: string;
    key: string;
  };

  const body = await file.arrayBuffer();

  const numPages = await getPagesCount(body);

  // const constructedFile = new File([body], file.name, { type: file.type });

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  console.log("response", response);

  if (!response.ok) {
    throw new Error(
      `Failed to upload file "${file.name}", failed with status code ${response.status}`,
    );
  }

  return {
    type: DocumentStorageType.S3_PATH,
    data: key,
    numPages: numPages,
  };
};
