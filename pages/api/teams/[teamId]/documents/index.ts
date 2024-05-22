import { NextApiRequest, NextApiResponse } from "next";

import { client } from "@/trigger";
import { DocumentStorageType } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { parsePageId } from "notion-utils";

import { errorhandler } from "@/lib/errorHandler";
import notion from "@/lib/notion";
import prisma from "@/lib/prisma";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";
import { CustomUser } from "@/lib/types";
import { getExtension, log } from "@/lib/utils";

import { authOptions } from "../../../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/documents
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId } = req.query as { teamId: string };

    const userId = (session.user as CustomUser).id;

    try {
      const { team } = await getTeamWithUsersAndDocument({
        teamId,
        userId,
        options: {
          where: {
            folderId: null,
          },
          orderBy: {
            createdAt: "desc",
          },
          include: {
            _count: {
              select: { links: true, views: true, versions: true },
            },
            links: {
              take: 1,
              select: { id: true },
            },
          },
        },
      });

      const documents = team.documents;

      return res.status(200).json(documents);
    } catch (error) {
      errorhandler(error, res);
    }
  } else if (req.method === "POST") {
    // POST /api/teams/:teamId/documents
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
    } = req.body as {
      name: string;
      url: string;
      storageType: DocumentStorageType;
      numPages?: number;
      type?: string;
      folderPathName?: string;
    };

    try {
      await getTeamWithUsersAndDocument({
        teamId,
        userId,
      });

      // Get passed type property or alternatively, the file extension and save it as the type
      const type = fileType || getExtension(name);

      // Check whether the Notion page is publically accessible or not
      if (type === "notion") {
        try {
          const pageId = parsePageId(fileUrl, { uuid: false });
          // if the page isn't accessible then end the process here.
          await notion.getPage(pageId);
        } catch (error) {
          return res
            .status(404)
            .end("This Notion page isn't publically available.");
        }
      }

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
          type: type,
          storageType,
          ownerId: (session.user as CustomUser).id,
          teamId: teamId,
          links: {
            create: {},
          },
          versions: {
            create: {
              file: fileUrl,
              type: type,
              storageType,
              numPages: numPages,
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
