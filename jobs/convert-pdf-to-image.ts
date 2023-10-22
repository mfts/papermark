import { client } from "@/trigger";
import { eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";
import prisma from "@/lib/prisma";

client.defineJob({
  id: "convert-pdf-to-image",
  name: "Convert PDF to Image",
  version: "0.0.1",
  trigger: eventTrigger({
    name: "document.uploaded",
    schema: z.object({
      documentId: z.string(),
      documentVersionId: z.string(),
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
        "https://fdcb4a73ebf4.ngrok.app/api/mupdf/get-pages",
        {
          method: "POST",
          body: JSON.stringify({ url: documentUrl.file }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      await io.logger.info("log response", { response });

      const { numPages } = await response.json() as { numPages: number; };
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
      await io.runTask(`upload-page-${currentPage}`, 
        async () => {
        // send page number to api/convert-page endpoint in a task and get back page img url
        const response = await fetch(
          "https://fdcb4a73ebf4.ngrok.app/api/mupdf/convert-page",
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
          }
        );

        if (!response.ok) {
          await io.logger.error("Failed to upload page", { payload });
          return;
        }

        const { documentPageId } = (await response.json()) as {
          documentPageId: string;
        };

        await io.logger.info(`Created document page for page ${currentPage}:`, {
          documentPageId,
          payload,
        });
        return { documentPageId, payload };
      });
    };

    return {
      success: true,
      message: "Successfully converted PDF to images",
    }
  },
});