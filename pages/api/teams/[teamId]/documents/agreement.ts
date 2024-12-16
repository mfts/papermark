import { NextApiRequest, NextApiResponse } from "next";

import { client } from "@/trigger";
import { DocumentStorageType } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { parsePageId } from "notion-utils";

import { errorhandler } from "@/lib/errorHandler";
import notion from "@/lib/notion";
import prisma from "@/lib/prisma";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";
import { convertFilesToPdfTask } from "@/lib/trigger/convert-files";
import { CustomUser } from "@/lib/types";
import { getExtension, log } from "@/lib/utils";

import { authOptions } from "../../../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // POST /api/teams/:teamId/documents/agreement
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const { teamId } = req.query as { teamId: string };

    const userId = (session.user as CustomUser).id;

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
      await getTeamWithUsersAndDocument({
        teamId,
        userId,
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
          ownerId: (session.user as CustomUser).id,
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
        console.log("converting docx to pdf");
        // Trigger convert-files-to-pdf task
        await convertFilesToPdfTask.trigger(
          {
            documentId: document.id,
            documentVersionId: document.versions[0].id,
            teamId,
          },
          {
            idempotencyKey: `${teamId}-${document.versions[0].id}`,
            tags: [`team_${teamId}`, `document_${document.id}`],
          },
        );
      }

      // skip triggering convert-pdf-to-image job for "notion" / "excel" documents
      if (type === "pdf") {
        // trigger document uploaded event to trigger convert-pdf-to-image job
        await client.sendEvent({
          id: document.versions[0].id, // unique eventId for the run
          name: "document.uploaded",
          payload: {
            documentVersionId: document.versions[0].id,
            teamId: teamId,
            documentId: document.id,
          },
        });
      }

      return res.status(201).json(document);
    } catch (error) {
      log({
        message: `Failed to create document. \n\n*teamId*: _${teamId}_, \n\n*file*: ${fileUrl} \n\n ${error}`,
        type: "error",
      });
      errorhandler(error, res);
    }
  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
