import { client } from "@/trigger";
import { eventTrigger, retry } from "@trigger.dev/sdk";
import { z } from "zod";

import { getFile } from "@/lib/files/get-file";
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
      teamId: z.string().optional(),
    }),
  }),
  run: async (payload, io, ctx) => {
    const { documentVersionId } = payload;

    // STATUS: initialized status
    const processingDocumentStatus = await io.createStatus(
      "processing-document",
      {
        //the label is compulsory on this first call
        label: "Processing document",
        //state is optional
        state: "loading",
        //data is an optional object. the values can be any type that is JSON serializable
        data: {
          text: "Processing document...",
          progress: 0,
          currentPage: 0,
          numPages: undefined,
        },
      },
    );

    // 1. get file url from document version
    const documentVersion = await io.runTask("get-document-url", async () => {
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

    // if documentVersion is null, log error and return
    if (!documentVersion) {
      await io.logger.error("File not found", { payload });
      await processingDocumentStatus.update("error", {
        //set data, this overrides the previous value
        state: "failure",
        data: {
          text: "Document not found",
          progress: 0,
          currentPage: 0,
          numPages: 0,
        },
      });
      return;
    }

    // 2. get signed url from file
    const signedUrl = await io.runTask("get-signed-url", async () => {
      return await getFile({
        type: documentVersion.storageType,
        data: documentVersion.file,
      });
    });

    if (!signedUrl) {
      await io.logger.error("Failed to get signed url", { payload });
      await processingDocumentStatus.update("error-signed-url", {
        //set data, this overrides the previous value
        state: "failure",
        data: {
          text: "Failed to retrieve document",
          progress: 0,
          currentPage: 0,
          numPages: 0,
        },
      });
      return;
    }

    let numPages = documentVersion.numPages;

    // skip if the numPages are already defined
    if (!numPages || numPages === 1) {
      // 3. send file to api/convert endpoint in a task and get back number of pages
      const muDocument = await io.runTask("get-number-of-pages", async () => {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/mupdf/get-pages`,
          {
            method: "POST",
            body: JSON.stringify({ url: signedUrl }),
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
        await io.logger.info("log response", { response });

        if (!response.ok) {
          await io.logger.error("Failed to get number of pages", {
            signedUrl,
            response,
          });
          throw new Error("Failed to get number of pages");
        }

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
      if (!conversionWithoutError) {
        break;
      }

      // increment currentPage
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
            throw new Error("Failed to convert page");
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
        // { retry: retry.standardBackoff },
        {
          // retry: {
          //   limit: 3,
          //   minTimeoutInMs: 1000,
          //   maxTimeoutInMs: 10000,
          //   factor: 2,
          //   randomize: true,
          // },
        },
        (error, task) => {
          conversionWithoutError = false;
          return { error: error as Error };
        },
      );

      // STATUS: retrieved-url
      await processingDocumentStatus.update(`processing-page-${currentPage}`, {
        //set data, this overrides the previous value
        data: {
          text: `${currentPage} / ${numPages} pages processed`,
          progress: currentPage / numPages!,
          currentPage: currentPage,
          numPages: numPages,
        },
      });
    }

    if (!conversionWithoutError) {
      await io.logger.error("Failed to process pages", { payload });
      // STATUS: error with processing document
      await processingDocumentStatus.update("error-processing-pages", {
        //set data, this overrides the previous value
        state: "failure",
        data: {
          text: `Error processing page ${currentPage} of ${numPages}`,
          progress: currentPage / numPages!,
          currentPage: currentPage,
          numPages: numPages,
        },
      });
      return;
    }

    // 5. after all pages are uploaded, update document version to hasPages = true
    await io.runTask("enable-pages", async () => {
      return prisma.documentVersion.update({
        where: {
          id: documentVersionId,
        },
        data: {
          numPages: numPages,
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

    // STATUS: enabled-pages
    await processingDocumentStatus.update("enabled-pages", {
      //set data, this overrides the previous value
      state: "loading",
      data: {
        text: "Enabling pages...",
        progress: 1,
      },
    });

    const { versionNumber, documentId } = payload;
    if (versionNumber) {
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

    // STATUS: enabled-pages
    await processingDocumentStatus.update("revalidate-links", {
      //set data, this overrides the previous value
      state: "loading",
      data: {
        text: "Revalidating link...",
        progress: 1,
      },
    });

    // initialize link revalidation for all the document's links
    await io.runTask("initiate-link-revalidation", async () => {
      await fetch(
        `${process.env.NEXTAUTH_URL}/api/revalidate?secret=${process.env.REVALIDATE_TOKEN}&documentId=${documentId}`,
      );
    });

    // STATUS: success
    await processingDocumentStatus.update("success", {
      state: "success",
      data: {
        text: "Processing complete",
      },
    });

    return {
      success: true,
      message: "Successfully converted PDF to images",
    };
  },
});
