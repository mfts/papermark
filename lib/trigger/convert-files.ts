import { client } from "@/trigger";
import { logger, retry, task } from "@trigger.dev/sdk/v3";

import { getFile } from "@/lib/files/get-file";
import { putFileServer } from "@/lib/files/put-file-server";
import prisma from "@/lib/prisma";

import { getExtensionFromContentType } from "../utils/get-content-type";

type ConvertPayload = {
  documentId: string;
  documentVersionId: string;
  teamId: string;
};

export const convertFilesToPdfTask = task({
  id: "convert-files-to-pdf",
  retry: { maxAttempts: 3 },
  queue: {
    concurrencyLimit: 10,
  },
  run: async (payload: ConvertPayload) => {
    const team = await prisma.team.findUnique({
      where: {
        id: payload.teamId,
      },
    });

    if (!team) {
      logger.error("Team not found", { teamId: payload.teamId });
      return;
    }

    const document = await prisma.document.findUnique({
      where: {
        id: payload.documentId,
      },
      select: {
        name: true,
        versions: {
          where: {
            id: payload.documentVersionId,
          },
          select: {
            file: true,
            originalFile: true,
            contentType: true,
            storageType: true,
          },
        },
      },
    });

    if (
      !document ||
      !document.versions[0] ||
      !document.versions[0].originalFile ||
      !document.versions[0].contentType
    ) {
      logger.error("Document not found", {
        documentId: payload.documentId,
        documentVersionId: payload.documentVersionId,
        teamId: payload.teamId,
      });
      return;
    }

    const fileUrl = await getFile({
      data: document.versions[0].originalFile,
      type: document.versions[0].storageType,
    });

    // Prepare form data
    const formData = new FormData();
    formData.append(
      "downloadFrom",
      JSON.stringify([
        {
          url: fileUrl,
        },
      ]),
    );
    formData.append("quality", "50");

    // Make the conversion request
    const conversionResponse = await retry.fetch(
      `${process.env.NEXT_PRIVATE_CONVERSION_BASE_URL}/forms/libreoffice/convert`,
      {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Basic ${process.env.NEXT_PRIVATE_INTERNAL_AUTH_TOKEN}`,
        },
        retry: {
          byStatus: {
            "500-599": {
              strategy: "backoff",
              maxAttempts: 3,
              factor: 2,
              minTimeoutInMs: 1_000,
              maxTimeoutInMs: 30_000,
              randomize: false,
            },
          },
        },
      },
    );

    if (!conversionResponse.ok) {
      const body = await conversionResponse.json();
      throw new Error(
        `Conversion failed: ${body.message} ${conversionResponse.status}`,
      );
    }

    const conversionBuffer = Buffer.from(
      await conversionResponse.arrayBuffer(),
    );

    console.log("conversionBuffer", conversionBuffer);

    // get docId from url with starts with "doc_" with regex
    const match = document.versions[0].originalFile.match(/(doc_[^\/]+)\//);
    const docId = match ? match[1] : undefined;

    // Save the converted file to the database
    const { type: storageType, data } = await putFileServer({
      file: {
        name: `${document.name}.pdf`,
        type: "application/pdf",
        buffer: conversionBuffer,
      },
      teamId: payload.teamId,
      docId: docId,
    });

    if (!data || !storageType) {
      logger.error("Failed to save converted file to database", {
        documentId: payload.documentId,
        documentVersionId: payload.documentVersionId,
        teamId: payload.teamId,
        docId: docId,
      });
      return;
    }

    console.log("data from conversion", data);
    console.log("storageType from conversion", storageType);

    await prisma.documentVersion.update({
      where: { id: payload.documentVersionId },
      data: {
        file: data,
        type: "pdf",
        storageType: storageType,
      },
    });

    // v2: trigger document uploaded event to trigger convert-pdf-to-image job
    await client.sendEvent({
      id: payload.documentVersionId, // unique eventId for the run
      name: "document.uploaded",
      payload: {
        documentVersionId: payload.documentVersionId,
        teamId: payload.teamId,
        documentId: payload.documentId,
      },
    });

    logger.info("Document converted", {
      documentId: payload.documentId,
      documentVersionId: payload.documentVersionId,
      teamId: payload.teamId,
      docId: docId,
    });
    return;
  },
});

// convert cad file to pdf
export const convertCadToPdfTask = task({
  id: "convert-cad-to-pdf",
  retry: { maxAttempts: 3 },
  queue: {
    concurrencyLimit: 2,
  },
  run: async (payload: ConvertPayload) => {
    const team = await prisma.team.findUnique({
      where: {
        id: payload.teamId,
      },
    });

    if (!team) {
      logger.error("Team not found", { teamId: payload.teamId });
      return;
    }

    const document = await prisma.document.findUnique({
      where: {
        id: payload.documentId,
      },
      select: {
        name: true,
        versions: {
          where: {
            id: payload.documentVersionId,
          },
          select: {
            file: true,
            originalFile: true,
            contentType: true,
            storageType: true,
          },
        },
      },
    });

    if (
      !document ||
      !document.versions[0] ||
      !document.versions[0].originalFile ||
      !document.versions[0].contentType
    ) {
      logger.error("Document not found", {
        documentId: payload.documentId,
        documentVersionId: payload.documentVersionId,
        teamId: payload.teamId,
      });
      return;
    }

    const fileUrl = await getFile({
      data: document.versions[0].originalFile,
      type: document.versions[0].storageType,
    });

    // create payload for cad to pdf conversion
    const tasksPayload = {
      tasks: {
        "import-file-v1": {
          operation: "import/url",
          url: fileUrl,
          filename: document.name,
        },
        "convert-file-v1": {
          operation: "convert",
          input: ["import-file-v1"],
          input_format: getExtensionFromContentType(
            document.versions[0].contentType,
          ),
          output_format: "pdf",
          engine: "cadconverter",
          all_layouts: true,
          auto_zoom: false,
        },
        "export-file-v1": {
          operation: "export/url",
          input: ["convert-file-v1"],
          inline: false,
          archive_multiple_files: false,
        },
      },
      redirect: true,
    };

    // Make the conversion request
    const conversionResponse = await retry.fetch(
      `${process.env.NEXT_PRIVATE_CONVERT_API_URL}`,
      {
        method: "POST",
        body: JSON.stringify(tasksPayload),
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PRIVATE_CONVERT_API_KEY}`,
          "Content-Type": "application/json",
        },
        retry: {
          byStatus: {
            "500-599": {
              strategy: "backoff",
              maxAttempts: 3,
              factor: 2,
              minTimeoutInMs: 1_000,
              maxTimeoutInMs: 30_000,
              randomize: false,
            },
          },
        },
      },
    );

    if (!conversionResponse.ok) {
      const body = await conversionResponse.json();
      throw new Error(
        `Conversion failed: ${body.message} ${conversionResponse.status}`,
      );
    }

    const conversionBuffer = Buffer.from(
      await conversionResponse.arrayBuffer(),
    );

    // get docId from url with starts with "doc_" with regex
    const match = document.versions[0].originalFile.match(/(doc_[^\/]+)\//);
    const docId = match ? match[1] : undefined;

    // Save the converted file to the database
    const { type: storageType, data } = await putFileServer({
      file: {
        name: `${document.name}.pdf`,
        type: "application/pdf",
        buffer: conversionBuffer,
      },
      teamId: payload.teamId,
      docId: docId,
    });

    if (!data || !storageType) {
      logger.error("Failed to save converted file to database", {
        documentId: payload.documentId,
        documentVersionId: payload.documentVersionId,
        teamId: payload.teamId,
        docId: docId,
      });
      return;
    }

    console.log("data from conversion", data);
    console.log("storageType from conversion", storageType);

    await prisma.documentVersion.update({
      where: { id: payload.documentVersionId },
      data: {
        file: data,
        type: "pdf",
        storageType: storageType,
      },
    });

    // v2: trigger document uploaded event to trigger convert-pdf-to-image job
    await client.sendEvent({
      id: payload.documentVersionId, // unique eventId for the run
      name: "document.uploaded",
      payload: {
        documentVersionId: payload.documentVersionId,
        teamId: payload.teamId,
        documentId: payload.documentId,
      },
    });

    logger.info("Document converted", {
      documentId: payload.documentId,
      documentVersionId: payload.documentVersionId,
      teamId: payload.teamId,
      docId: docId,
    });
    return;
  },
});
