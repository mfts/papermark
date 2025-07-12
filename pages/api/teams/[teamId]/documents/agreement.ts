import { NextApiResponse } from "next";

import { DocumentStorageType } from "@prisma/client";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";
import { convertFilesToPdfTask } from "@/lib/trigger/convert-files";
import { convertPdfToImageRoute } from "@/lib/trigger/pdf-to-image-route";
import { getExtension, log } from "@/lib/utils";
import { conversionQueue } from "@/lib/utils/trigger-utils";

async function handleCreateAgreement(
  req: AuthenticatedRequest,
  res: NextApiResponse,
): Promise<void> {
  const { teamId } = req.query as { teamId: string };

  // Assuming data is an object with `name` and `description` properties
  const {
    name,
    url: fileUrl,
    storageType,
    numPages,
    type: fileType,
    folderPathName,
    fileSize,
    contentType,
  } = req.body as {
    name: string;
    url: string;
    storageType: DocumentStorageType;
    numPages?: number;
    type?: string;
    folderPathName?: string;
    fileSize?: number;
    contentType: string;
  };

  try {
    const { team } = await getTeamWithUsersAndDocument({
      teamId,
      userId: req.user.id,
    });

    // Get passed type property or alternatively, the file extension and save it as the type
    const type = fileType || getExtension(name);

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

    // Save data to the database
    const document = await prisma.document.create({
      data: {
        name: name,
        numPages: numPages,
        file: fileUrl,
        originalFile: fileUrl,
        contentType,
        type: type,
        storageType,
        ownerId: req.user.id,
        teamId: teamId,
        links: {
          // create link for agreement without any protection
          create: {
            name: "Generated Agreement Link",
            emailProtected: false,
            enableFeedback: false,
            enableNotification: false,
            teamId,
          },
        },
        versions: {
          create: {
            file: fileUrl,
            type: type,
            storageType,
            originalFile: fileUrl,
            contentType,
            numPages: numPages,
            fileSize: fileSize,
            isPrimary: true,
            versionNumber: 1,
          },
        },
        folderId: folder?.id ? folder.id : null,
      },
      include: {
        links: true,
        versions: true,
      },
    });

    if (type === "docs") {
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
          queue: conversionQueue(team.plan),
          concurrencyKey: teamId,
        },
      );
    }

    if (type === "pdf") {
      await convertPdfToImageRoute.trigger(
        {
          documentId: document.id,
          documentVersionId: document.versions[0].id,
          teamId,
          // docId: fileUrl.split("/")[1],
        },
        {
          idempotencyKey: `${teamId}-${document.versions[0].id}`,
          tags: [
            `team_${teamId}`,
            `document_${document.id}`,
            `version:${document.versions[0].id}`,
          ],
          queue: conversionQueue(team.plan),
          concurrencyKey: teamId,
        },
      );
    }

    res.status(201).json(document);
  } catch (error) {
    log({
      message: `Failed to create document. \n\n*teamId*: _${teamId}_, \n\n*file*: ${fileUrl} \n\n ${error}`,
      type: "error",
    });
    errorhandler(error, res);
  }
}

export default createTeamHandler({
  POST: handleCreateAgreement,
});
