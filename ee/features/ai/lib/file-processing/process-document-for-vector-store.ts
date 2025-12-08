import { openai } from "@/ee/features/ai/lib/models/openai";
import { DocumentStorageType } from "@prisma/client";
import { toFile } from "openai";
import path from "path";

import { getFile } from "@/lib/files/get-file";

/**
 * Process a document and prepare it for vector store upload
 * Downloads the file from storage and returns it as a buffer
 * @param filePath - The file path/key in storage
 * @param storageType - The storage type (S3_PATH or VERCEL_BLOB)
 * @returns File ID
 */
export async function processDocumentForVectorStore(
  filePath: string,
  storageType: DocumentStorageType,
): Promise<{ fileId: string }> {
  try {
    // Get the file URL
    const fileUrl = await getFile({
      type: storageType,
      data: filePath,
      isDownload: true,
    });

    // Fetch the file
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    // Extract filename from the original file path (not the presigned URL)
    const fileName = path.basename(filePath);

    // Convert response to buffer and create a properly named file
    // This prevents OpenAI from inferring extension from URL query params
    // const buffer = await response.arrayBuffer();
    const file = await toFile(response, fileName, { type: "application/pdf" });

    const fileResponse = await openai.files.create({
      file,
      purpose: "assistants",
    });

    return { fileId: fileResponse.id };
  } catch (error) {
    console.error("Error processing document for vector store:", error);
    throw new Error("Failed to process document for vector store");
  }
}
