import { DocumentStorageType } from "@prisma/client";

export type DocumentData = {
  name: string;
  key: string;
  storageType: DocumentStorageType;
};

export const createDocument = async ({
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
  const response = await fetch(`/api/teams/${teamId}/documents`, {
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
}: {
  documentData: DocumentData;
  documentId: string;
  teamId: string;
  numPages?: number;
}) => {
  const response = await fetch(
    `/api/teams/${teamId}/documents/${documentId}/versions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: documentData.key,
        storageType: documentData.storageType,
        numPages: numPages,
        type: "pdf",
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response;
};
