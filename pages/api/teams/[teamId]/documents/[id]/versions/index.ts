import { NextApiResponse } from "next";

import { DocumentStorageType } from "@prisma/client";

import { copyFileToBucketServer } from "@/lib/files/copy-file-to-bucket-server";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";
import { convertFilesToPdfTask } from "@/lib/trigger/convert-files";
import { processVideo } from "@/lib/trigger/optimize-video-files";
import { convertPdfToImageRoute } from "@/lib/trigger/pdf-to-image-route";
import { log } from "@/lib/utils";
import { conversionQueue } from "@/lib/utils/trigger-utils";

export default createTeamHandler({
  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // POST /api/teams/:teamId/documents/:id/versions
    const { id: documentId } = req.query as {
      id: string;
    };
    const { url, type, numPages, storageType, contentType, fileSize } =
      req.body as {
        url: string;
        type: string;
        numPages: number;
        storageType: DocumentStorageType;
        contentType: string;
        fileSize: number | undefined;
      };

    try {
      const { team, document } = await getTeamWithUsersAndDocument({
        teamId: req.team!.id,
        userId: req.user.id,
        docId: documentId,
        checkOwner: true,
        options: {
          select: {
            id: true,
            advancedExcelEnabled: true,
            versions: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { versionNumber: true },
            },
          },
        },
      });

      // create a new document version
      const currentVersionNumber = document?.versions
        ? document.versions[0].versionNumber
        : 1;
      const version = await prisma.documentVersion.create({
        data: {
          documentId: documentId,
          file: url,
          originalFile: url,
          type: type,
          storageType,
          numPages: document?.advancedExcelEnabled ? 1 : numPages,
          isPrimary: true,
          versionNumber: currentVersionNumber + 1,
          contentType,
          fileSize,
        },
      });

      // turn off isPrimary flag for all other versions
      await prisma.documentVersion.updateMany({
        where: {
          documentId: documentId,
          id: { not: version.id },
        },
        data: {
          isPrimary: false,
        },
      });

      // turn off isPrimary flag for all other versions
      await prisma.documentVersion.updateMany({
        where: {
          documentId: documentId,
          id: { not: version.id },
        },
        data: {
          isPrimary: false,
        },
      });

      if (type === "docs" || type === "slides") {
        await convertFilesToPdfTask.trigger(
          {
            documentVersionId: version.id,
            teamId: req.team!.id,
            documentId,
          },
          {
            idempotencyKey: `${req.team!.id}-${version.id}-docs`,
            tags: [
              `team_${req.team!.id}`,
              `document_${documentId}`,
              `version:${version.id}`,
            ],
            queue: conversionQueue(team.plan),
            concurrencyKey: req.team!.id,
          },
        );
      }

      if (type === "video") {
        await processVideo.trigger(
          {
            videoUrl: url,
            teamId: req.team!.id,
            docId: url.split("/")[1], // Extract doc_xxxx from teamId/doc_xxxx/filename
            documentVersionId: version.id,
            fileSize: fileSize || 0,
          },
          {
            idempotencyKey: `${req.team!.id}-${version.id}`,
            tags: [
              `team_${req.team!.id}`,
              `document_${documentId}`,
              `version:${version.id}`,
            ],
            queue: conversionQueue(team.plan),
            concurrencyKey: req.team!.id,
          },
        );
      }

      // trigger document uploaded event to trigger convert-pdf-to-image job
      if (type === "pdf") {
        await convertPdfToImageRoute.trigger(
          {
            documentId: documentId,
            documentVersionId: version.id,
            teamId: req.team!.id,
            // docId: version.file.split("/")[1], // Extract doc_xxxx from teamId/doc_xxxx/filename
            versionNumber: version.versionNumber,
          },
          {
            idempotencyKey: `${req.team!.id}-${version.id}`,
            tags: [
              `team_${req.team!.id}`,
              `document_${documentId}`,
              `version:${version.id}`,
            ],
            queue: conversionQueue(team.plan),
            concurrencyKey: req.team!.id,
          },
        );
      }

      if (type === "sheet" && document?.advancedExcelEnabled) {
        console.log("copying file to bucket server");
        await copyFileToBucketServer({
          filePath: version.file,
          storageType: version.storageType,
          teamId: req.team!.id,
        });
      }

      res.status(200).json({ id: documentId });
    } catch (error) {
      log({
        message: `Failed to create new version for document: _${documentId}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${req.team!.id}, userId: ${req.user.id}}\``,
        type: "error",
      });
      res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  },
});
