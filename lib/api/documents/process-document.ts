import { parsePageId } from "notion-utils";

import { DocumentData } from "@/lib/documents/create-document";
import notion from "@/lib/notion";
import prisma from "@/lib/prisma";
import { convertCadToPdfTask } from "@/lib/trigger/convert-files";
import { convertFilesToPdfTask } from "@/lib/trigger/convert-files";
import { processVideo } from "@/lib/trigger/optimize-video-files";
import { convertPdfToImageRoute } from "@/lib/trigger/pdf-to-image-route";
import { getExtension } from "@/lib/utils";
import { conversionQueue } from "@/lib/utils/trigger-utils";
import { sendDocumentCreatedWebhook } from "@/lib/webhook/triggers/document-created";
import { sendLinkCreatedWebhook } from "@/lib/webhook/triggers/link-created";

type ProcessDocumentParams = {
  documentData: DocumentData;
  teamId: string;
  teamPlan: string;
  userId?: string;
  folderPathName?: string;
  createLink?: boolean;
  isExternalUpload?: boolean;
};

export const processDocument = async ({
  documentData,
  teamId,
  teamPlan,
  userId,
  folderPathName,
  createLink = false,
  isExternalUpload = false,
}: ProcessDocumentParams) => {
  const {
    name,
    key,
    storageType,
    contentType,
    supportedFileType,
    fileSize,
    numPages,
  } = documentData;

  // Get passed type property or alternatively, the file extension and save it as the type
  const type = supportedFileType || getExtension(name);

  // Check whether the Notion page is publically accessible or not
  if (type === "notion") {
    try {
      const pageId = parsePageId(key, { uuid: false });
      // if the page isn't accessible then end the process here.
      if (!pageId) {
        throw new Error("Notion page not found");
      }
      await notion.getPage(pageId);
    } catch (error) {
      throw new Error("This Notion page isn't publically available.");
    }
  }

  const folder = await prisma.folder.findUnique({
    where: {
      teamId_path: {
        teamId,
        path: "/" + folderPathName,
      },
    },
    select: {
      id: true,
    },
  });

  // determine if the document is download only
  const isDownloadOnly = type === "zip" || type === "map";

  // Save data to the database
  const document = await prisma.document.create({
    data: {
      name: name,
      numPages: numPages,
      file: key,
      originalFile: key,
      contentType: contentType,
      type: type,
      storageType,
      ownerId: userId,
      teamId: teamId,
      downloadOnly: isDownloadOnly,
      ...(createLink && {
        links: {
          create: {
            teamId,
          },
        },
      }),
      versions: {
        create: {
          file: key,
          originalFile: key,
          contentType: contentType,
          type: type,
          storageType,
          numPages: numPages,
          isPrimary: true,
          versionNumber: 1,
          fileSize: fileSize,
        },
      },
      folderId: folder?.id ?? null,
      isExternalUpload,
    },
    include: {
      links: true,
      versions: true,
    },
  });

  // Trigger appropriate conversion tasks based on document type
  if (type === "docs" || type === "slides") {
    await convertFilesToPdfTask.trigger(
      {
        documentId: document.id,
        documentVersionId: document.versions[0].id,
        teamId,
      },
      {
        idempotencyKey: `${teamId}-${document.versions[0].id}-docs`,
        tags: [
          `team_${teamId}`,
          `document_${document.id}`,
          `version:${document.versions[0].id}`,
        ],
        queue: conversionQueue(teamPlan),
        concurrencyKey: teamId,
      },
    );
  }

  if (type === "cad") {
    await convertCadToPdfTask.trigger(
      {
        documentId: document.id,
        documentVersionId: document.versions[0].id,
        teamId,
      },
      {
        idempotencyKey: `${teamId}-${document.versions[0].id}-cad`,
        tags: [
          `team_${teamId}`,
          `document_${document.id}`,
          `version:${document.versions[0].id}`,
        ],
        queue: conversionQueue(teamPlan),
        concurrencyKey: teamId,
      },
    );
  }

  if (type === "video") {
    await processVideo.trigger(
      {
        videoUrl: key,
        teamId,
        docId: key.split("/")[1], // Extract doc_xxxx from teamId/doc_xxxx/filename
        documentVersionId: document.versions[0].id,
        fileSize: fileSize || 0,
      },
      {
        idempotencyKey: `${teamId}-${document.versions[0].id}`,
        tags: [
          `team_${teamId}`,
          `document_${document.id}`,
          `version:${document.versions[0].id}`,
        ],
        queue: conversionQueue(teamPlan),
        concurrencyKey: teamId,
      },
    );
  }

  // skip triggering convert-pdf-to-image job for "notion" / "excel" documents
  if (type === "pdf") {
    await convertPdfToImageRoute.trigger(
      {
        documentId: document.id,
        documentVersionId: document.versions[0].id,
        teamId,
      },
      {
        idempotencyKey: `${teamId}-${document.versions[0].id}`,
        tags: [
          `team_${teamId}`,
          `document_${document.id}`,
          `version:${document.versions[0].id}`,
        ],
        queue: conversionQueue(teamPlan),
        concurrencyKey: teamId,
      },
    );
  }

  // Send webhooks
  await Promise.all([
    !isExternalUpload &&
      sendDocumentCreatedWebhook({
        teamId,
        data: {
          document_id: document.id,
        },
      }),
    createLink &&
      sendLinkCreatedWebhook({
        teamId,
        data: {
          document_id: document.id,
          link_id: document.links[0].id,
        },
      }),
  ]);

  return document;
};
