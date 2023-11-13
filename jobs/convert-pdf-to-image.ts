import { client } from "@/trigger";
import { eventTrigger, retry } from "@trigger.dev/sdk";
import { z } from "zod";
import prisma from "@/lib/prisma";

client.defineJob({
  id: "convert-pdf-to-image",
  name: "Convert PDF to Image",
  version: "0.0.1",
  trigger: eventTrigger({
    name: "document.uploaded",
    schema: z.object({
      documentVersionId: z.string(),
      versionNumber: z.number().int().optional(),
      documentId: z.string().optional(),
    }),
  }),
  run: async (payload, io, ctx) => {
    const { documentVersionId } = payload;

    // get file url from document version
    const documentUrl = await io.runTask("get-document-url", async () => {
      return prisma.documentVersion.findUnique({
        where: {
          id: documentVersionId,
        },
        select: {
          file: true,
        },
      });
    });

    // if documentUrl is null, log error and return
    if (!documentUrl) {
      await io.logger.error("File not found", { payload });
      return;
    }

    // send file to api/convert endpoint in a task and get back number of pages
    const muDocument = await io.runTask("get-number-of-pages", async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/mupdf/get-pages`,
        {
          method: "POST",
          body: JSON.stringify({ url: documentUrl.file }),
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      await io.logger.info("log response", { response });

      const { numPages } = (await response.json()) as { numPages: number };
      return { numPages };
    });

    if (!muDocument || muDocument.numPages < 1) {
      await io.logger.error("Failed to get number of pages", { payload });
      return;
    }

    // iterate through pages and upload to blob in a task
    let currentPage = 0;
    for (var i = 0; i < muDocument.numPages; ++i) {
      currentPage = i + 1;
      await io.runTask(
        `upload-page-${currentPage}`,
        async () => {
          // send page number to api/convert-page endpoint in a task and get back page img url
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/mupdf/convert-page`,
            {
              method: "POST",
              body: JSON.stringify({
                documentVersionId: documentVersionId,
                pageNumber: currentPage,
                url: documentUrl.file,
              }),
              headers: {
                "Content-Type": "application/json",
              },
            },
          );

          if (!response.ok) {
            await io.logger.error("Failed to upload page", { payload });
            return;
          }

          const { documentPageId } = (await response.json()) as {
            documentPageId: string;
          };

          await io.logger.info(
            `Created document page for page ${currentPage}:`,
            {
              documentPageId,
              payload,
            },
          );
          return { documentPageId, payload };
        },
        { retry: retry.standardBackoff },
      );
    }

    // after all pages are uploaded, update document version to hasPages = true
    await io.runTask("enable-pages", async () => {
      return prisma.documentVersion.update({
        where: {
          id: documentVersionId,
        },
        data: {
          hasPages: true,
          isPrimary: true,
        },
        select: {
          id: true,
          hasPages: true,
          isPrimary: true,
        },
      });
    });

    if (payload.versionNumber) {
      const { versionNumber, documentId } = payload;
      // after all pages are uploaded, update all other versions to be not primary
      await io.runTask("update-version-number", async () => {
        return prisma.documentVersion.updateMany({
          where: {
            documentId: documentId,
            versionNumber: {
              not: versionNumber,
            },
          },
          data: {
            isPrimary: false,
          },
        });
      });
    }

    return {
      success: true,
      message: "Successfully converted PDF to images",
    };
  },
});
