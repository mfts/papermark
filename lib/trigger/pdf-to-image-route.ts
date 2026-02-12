import { logger, task } from "@trigger.dev/sdk/v3";

import { getFile } from "@/lib/files/get-file";
import prisma from "@/lib/prisma";
import { updateStatus } from "@/lib/utils/generate-trigger-status";

type ConvertPdfToImagePayload = {
  documentId: string;
  documentVersionId: string;
  teamId: string;
  versionNumber?: number;
};

export const convertPdfToImageRoute = task({
  id: "convert-pdf-to-image-route",
  run: async (payload: ConvertPdfToImagePayload) => {
    const { documentVersionId, teamId, documentId, versionNumber } = payload;

    updateStatus({ progress: 0, text: "Initializing..." });

    // 1. get file url from document version
    const documentVersion = await prisma.documentVersion.findUnique({
      where: {
        id: documentVersionId,
      },
      select: {
        file: true,
        storageType: true,
        numPages: true,
      },
    });

    // if documentVersion is null, log error and return
    if (!documentVersion) {
      logger.error("File not found", { payload });
      updateStatus({ progress: 0, text: "Document not found" });
      return {
        success: false,
        message: "Document version not found",
      };
    }

    logger.info("Document version", { documentVersion });
    updateStatus({ progress: 10, text: "Retrieving file..." });

    // 2. get signed url from file
    const signedUrl = await getFile({
      type: documentVersion.storageType,
      data: documentVersion.file,
    });

    logger.info("Retrieved signed url", { signedUrl });

    if (!signedUrl) {
      logger.error("Failed to get signed url", { payload });
      updateStatus({ progress: 0, text: "Failed to retrieve document" });
      return {
        success: false,
        message: "Failed to get signed URL for document",
      };
    }

    let numPages = documentVersion.numPages;

    // skip if the numPages are already defined
    if (!numPages || numPages === 1) {
      // 3. send file to api/convert endpoint in a task and get back number of pages
      logger.info("Sending file to api/get-pages endpoint");

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/mupdf/get-pages`,
          {
            method: "POST",
            body: JSON.stringify({ url: signedUrl }),
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
            },
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          logger.error("Failed to get number of pages", {
            signedUrl,
            status: response.status,
            error: errorData,
            payload,
          });
          updateStatus({ progress: 0, text: "Failed to get number of pages" });
          return {
            success: false,
            message: "Failed to get number of pages",
          };
        }

        const { numPages: numPagesResult } = (await response.json()) as {
          numPages: number;
        };

        logger.info("Received number of pages", { numPagesResult });

        if (numPagesResult < 1) {
          logger.error("Failed to get number of pages", { payload });
          updateStatus({ progress: 0, text: "Failed to get number of pages" });
          return {
            success: false,
            message: "Failed to get number of pages - invalid page count",
          };
        }

        numPages = numPagesResult;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        const errorCause =
          error instanceof Error && error.cause ? error.cause : undefined;

        logger.error("Failed to fetch page count", {
          error: errorMessage,
          cause: errorCause,
          payload,
        });
        updateStatus({ progress: 0, text: "Failed to retrieve page count" });
        return {
          success: false,
          message: `Failed to fetch page count: ${errorMessage}`,
        };
      }
    }

    updateStatus({ progress: 20, text: "Converting document..." });

    // 4. iterate through pages and upload to blob in a task
    let currentPage = 0;
    let conversionWithoutError = true;
    for (var i = 0; i < numPages; ++i) {
      if (!conversionWithoutError) {
        break;
      }

      // increment currentPage
      currentPage = i + 1;
      logger.info(`Converting page ${currentPage}`, {
        currentPage,
        numPages,
      });

      try {
        // send page number to api/convert-page endpoint in a task and get back page img url
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/mupdf/convert-page`,
          {
            method: "POST",
            body: JSON.stringify({
              documentVersionId: documentVersionId,
              pageNumber: currentPage,
              url: signedUrl,
              teamId: teamId,
            }),
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
            },
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          // If document was blocked, stop processing entirely
          if (response.status === 400 && errorData.error?.includes("blocked")) {
            logger.error("Document blocked", {
              pageNumber: currentPage,
              matchedUrl: errorData.matchedUrl,
              matchedKeyword: errorData.matchedKeyword,
              payload,
            });

            updateStatus({
              progress: 0,
              text: `Document couldn't be processed`,
            });

            throw new Error("Document processing blocked");
          }

          throw new Error("Failed to convert page");
        }

        const { documentPageId } = (await response.json()) as {
          documentPageId: string;
        };

        logger.info(`Created document page for page ${currentPage}:`, {
          documentPageId,
          payload,
        });
      } catch (error: unknown) {
        conversionWithoutError = false;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        const errorCause =
          error instanceof Error && error.cause ? error.cause : undefined;

        logger.error("Failed to convert page", {
          pageNumber: currentPage,
          error: errorMessage,
          cause: errorCause,
          payload,
        });
      }

      updateStatus({
        progress: (currentPage / numPages) * 100,
        text: `${currentPage} / ${numPages} pages processed`,
      });
    }

    if (!conversionWithoutError) {
      logger.error("Failed to process pages", { payload });
      updateStatus({
        progress: (currentPage / numPages) * 100,
        text: `Error processing page ${currentPage} of ${numPages}`,
      });
      return {
        success: false,
        message: `Failed to process page ${currentPage} of ${numPages}`,
        totalPages: numPages,
        failedAtPage: currentPage,
      };
    }

    // 5. after all pages are uploaded, update document version to hasPages = true
    await prisma.documentVersion.update({
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

    logger.info("Enabling pages");
    updateStatus({
      progress: 90,
      text: "Enabling pages...",
    });

    if (versionNumber) {
      // after all pages are uploaded, update all other versions to be not primary
      await prisma.documentVersion.updateMany({
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
    }

    logger.info("Revalidating link");
    updateStatus({
      progress: 95,
      text: "Revalidating link...",
    });

    // initialize link revalidation for all the document's links
    await fetch(
      `${process.env.NEXTAUTH_URL}/api/revalidate?secret=${process.env.REVALIDATE_TOKEN}&documentId=${documentId}`,
    );

    updateStatus({
      progress: 100,
      text: "Processing complete",
    });

    logger.info("Processing complete");
    return {
      success: true,
      message: "Successfully converted PDF to images",
      totalPages: numPages,
    };
  },
});
