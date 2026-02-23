import { DocumentStorageType } from "@prisma/client";
import z from "zod";

export type DocumentData = {
  name: string;
  key: string;
  storageType: DocumentStorageType;
  contentType: string | null; // actual file mime type
  supportedFileType: string; // papermark types: "pdf", "sheet", "docs", "slides", "map", "zip"
  fileSize: number | undefined; // file size in bytes
  numPages?: number;
  enableExcelAdvancedMode?: boolean;
};

export const createDocument = async ({
  documentData,
  teamId,
  numPages,
  folderPathName,
  createLink = false,
  token,
}: {
  documentData: DocumentData;
  teamId: string;
  numPages?: number;
  folderPathName?: string;
  createLink?: boolean;
  token?: string;
}) => {
  // create a document in the database with the blob url
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/teams/${teamId}/documents`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        name: documentData.name,
        url: documentData.key,
        storageType: documentData.storageType,
        numPages: numPages,
        folderPathName: folderPathName,
        type: documentData.supportedFileType,
        contentType: documentData.contentType,
        createLink: createLink,
        fileSize: documentData.fileSize,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error);
  }

  return response;
};

export const createAgreementDocument = async ({
  documentData,
  teamId,
  numPages,
  folderPathName,
}: {
  documentData: DocumentData;
  teamId: string;
  numPages?: number;
  folderPathName?: string;
}) => {
  // create a document in the database with the blob url
  const response = await fetch(`/api/teams/${teamId}/documents/agreement`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: documentData.name,
      url: documentData.key,
      storageType: documentData.storageType,
      numPages: numPages,
      folderPathName: folderPathName,
      type: documentData.supportedFileType,
      contentType: documentData.contentType,
      fileSize: documentData.fileSize,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response;
};

// create a new version in the database
export const createNewDocumentVersion = async ({
  documentData,
  documentId,
  teamId,
  numPages,
  token,
}: {
  documentData: DocumentData;
  documentId: string;
  teamId: string;
  numPages?: number;
  token?: string;
}) => {
  try {
    const documentIdParsed = z.string().cuid().parse(documentId);

    // Use absolute URL when a token is provided (server-side / webhook context),
    // otherwise use a relative URL (client-side context).
    const baseUrl = token ? process.env.NEXT_PUBLIC_BASE_URL : "";

    const response = await fetch(
      `${baseUrl}/api/teams/${teamId}/documents/${documentIdParsed}/versions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          url: documentData.key,
          storageType: documentData.storageType,
          numPages: numPages,
          type: documentData.supportedFileType,
          contentType: documentData.contentType,
          fileSize: documentData.fileSize,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error("Error creating new document version:", error);
    throw new Error("Invalid document ID or team ID");
  }
};
