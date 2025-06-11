import { DocumentStorageType } from "@prisma/client";
import { getDownloadUrl } from "@vercel/blob";
import { match } from "ts-pattern";

export type GetFileOptions = {
  type: DocumentStorageType;
  data: string;
  isDownload?: boolean;
};

export const getFile = async ({
  type,
  data,
  isDownload = false,
}: GetFileOptions): Promise<string> => {
  const url = await match(type)
    .with(DocumentStorageType.VERCEL_BLOB, () => {
      if (isDownload) {
        return getDownloadUrl(data);
      } else {
        return data;
      }
    })
    .with(DocumentStorageType.S3_PATH, async () => getFileFromS3(data))
    .exhaustive();

  return url;
};

const getFileFromS3 = async (key: string) => {
  const isServer = typeof window === 'undefined' && process.env.INTERNAL_API_KEY;

  if (isServer) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/file/s3/get-presigned-get-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
        },
        body: JSON.stringify({ key: key }),
      },
    );

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(
          error.message || `Request failed with status ${response.status}`,
        );
      } catch (parseError) {
        // Handle cases where the response isn't valid JSON
        throw new Error(`Request failed with status ${response.status}`);
      }
    }

    const { url } = (await response.json()) as { url: string };
    return url;
  } else {
    const response = await fetch(`/api/file/s3/get-presigned-get-url-proxy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key: key }),
    });

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(
          error.message || `Request failed with status ${response.status}`,
        );
      } catch (parseError) {
        throw new Error(`Request failed with status ${response.status}`);
      }
    }

    const { url } = (await response.json()) as { url: string };
    return url;
  }
};
