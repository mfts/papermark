import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { client } from "@/trigger";
import { DocumentStorageType } from "@prisma/client";
import { getServerSession } from "next-auth/next";

import { copyFileToBucketServer } from "@/lib/files/copy-file-to-bucket-server";
import prisma from "@/lib/prisma";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";
import { convertFilesToPdfTask } from "@/lib/trigger/convert-files";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // POST /api/teams/:teamId/documents/:id/versions
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    // get document id from query params
    const { teamId, id: documentId } = req.query as {
      teamId: string;
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

    const userId = (session.user as CustomUser).id;

    try {
      const { document } = await getTeamWithUsersAndDocument({
        teamId,
        userId,
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
        console.log("converting docx or pptx to pdf");
        // Trigger convert-files-to-pdf task
        await convertFilesToPdfTask.trigger(
          {
            documentVersionId: version.id,
            teamId,
            documentId,
          },
          {
            idempotencyKey: `${teamId}-${version.id}`,
            tags: [`team_${teamId}`, `document_${documentId}`],
          },
        );
      }
      // trigger document uploaded event to trigger convert-pdf-to-image job
      if (type === "pdf") {
        await client.sendEvent({
          id: version.id,
          name: "document.uploaded",
          payload: {
            documentVersionId: version.id,
            versionNumber: version.versionNumber,
            documentId: documentId,
            teamId: teamId,
          },
        });
      }

      if (type === "sheet" && document?.advancedExcelEnabled) {
        console.log("copying file to bucket server");
        await copyFileToBucketServer({
          filePath: version.file,
          storageType: version.storageType,
        });
      }

      res.status(200).json({ id: documentId });
    } catch (error) {
      log({
        message: `Failed to create new version for document: _${documentId}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, userId: ${userId}}\``,
        type: "error",
      });
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else {
    // We only allow GET requests
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
