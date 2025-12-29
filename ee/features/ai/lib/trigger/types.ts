import { DocumentStorageType } from "@prisma/client";

export type AIProcessingStatus =
  | "pending"
  | "retrieving"
  | "processing"
  | "uploading"
  | "indexing"
  | "completed"
  | "failed";

export type AIProcessingMetadata = {
  status: AIProcessingStatus;
  documentName: string;
  documentId: string;
  step: string;
  progress: number;
  error?: string;
  vectorStoreFileId?: string;
  fileId?: string;
};

export type ProcessDocumentPayload = {
  documentId: string;
  documentVersionId: string;
  teamId: string;
  vectorStoreId: string;
  documentName: string;
  filePath: string;
  storageType: DocumentStorageType;
  contentType: string;
  metadata: {
    teamId: string;
    documentId: string;
    documentName: string;
    versionId: string;
    folderId?: string;
    dataroomId?: string;
    dataroomDocumentId?: string;
    dataroomFolderId?: string;
  };
};

export type ProcessFilePayload = {
  documentId: string;
  documentVersionId: string;
  teamId: string;
  documentName: string;
  filePath: string;
  storageType: DocumentStorageType;
  contentType: string;
};

export type AddToVectorStorePayload = {
  fileId: string;
  vectorStoreId: string;
  metadata: {
    teamId: string;
    documentId: string;
    documentName: string;
    versionId: string;
    folderId?: string;
    dataroomId?: string;
    dataroomDocumentId?: string;
    dataroomFolderId?: string;
  };
};

// Supported content types
export const PDF_CONTENT_TYPES = ["application/pdf"];

export const EXCEL_CONTENT_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
];

export const IMAGE_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const SUPPORTED_AI_CONTENT_TYPES = [
  ...PDF_CONTENT_TYPES,
  ...EXCEL_CONTENT_TYPES,
  ...IMAGE_CONTENT_TYPES,
];
