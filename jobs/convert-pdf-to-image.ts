import { client } from "@/trigger";
import { eventTrigger, retry } from "@trigger.dev/sdk";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getFile } from "@/lib/files/get-file";
import { error } from "console";

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
      teamId: z.string().optional(),
    }),
  }),
  run: async (payload, io, ctx) => {
    const { documentVersionId } = payload;

    // 1. get file url from document version
    const documentUrl = await io.runTask("get-document-url", async () => {
      return prisma.documentVersion.findUnique({
        where: {
          id: documentVersionId,
        },
        select: {
          file: true,
          storageType: true,
          numPages: true,
        },
      });
    });

    // if documentUrl is null, log error and return
    if (!documentUrl) {
      await io.logger.error("File not found", { payload });
      return;
    }

    // 2. get signed url from file
    const signedUrl = await io.runTask("get-signed-url", async () => {
      return await getFile({
        type: documentUrl.storageType,
        data: documentUrl.file,
      });
    });

    if (!signedUrl) {
      await io.logger.error("Failed to get signed url", { payload });
      return;
    }

    let numPages = documentUrl.numPages;

    // skip if the numPages are already defined
    if (!numPages) {
      // 3. send file to api/convert endpoint in a task and get back number of pages
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

      numPages = muDocument.numPages;
    }

    // 4. iterate through pages and upload to blob in a task
    let currentPage = 0;
    let conversionWithoutError = true;
    for (var i = 0; i < numPages; ++i) {
      currentPage = i + 1;
      if (!conversionWithoutError) {
        break;
      }
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
                url: signedUrl,
                teamId: payload.teamId,
              }),
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
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
        (error) => {
          conversionWithoutError = false;
          return { error: error as Error };
        },
      );
    }

    if (!conversionWithoutError) {
      await io.logger.error("Failed to process pages", { payload });
      return { success: false, message: "Failed to process pages" };
    }

    // 5. after all pages are uploaded, update document version to hasPages = true
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

      await io.runTask("initiate-link-revalidation", async () => {
        await fetch(
          `${process.env.NEXTAUTH_URL}/api/revalidate?secret=${process.env.REVALIDATE_TOKEN}&documentId=${documentId}`,
        );
      });
    }

    return {
      success: true,
      message: "Successfully converted PDF to images",
    };
  },
});
