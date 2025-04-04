import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { DocumentStorageType, Prisma } from "@prisma/client";
import { waitUntil } from "@vercel/functions";
import { getServerSession } from "next-auth/next";
import { parsePageId } from "notion-utils";

import { hashToken } from "@/lib/api/auth/token";
import { errorhandler } from "@/lib/errorHandler";
import notion from "@/lib/notion";
import prisma from "@/lib/prisma";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";
import {
  convertCadToPdfTask,
  convertFilesToPdfTask,
} from "@/lib/trigger/convert-files";
import { processVideo } from "@/lib/trigger/optimize-video-files";
import { convertPdfToImageRoute } from "@/lib/trigger/pdf-to-image-route";
import { CustomUser } from "@/lib/types";
import { getExtension, log } from "@/lib/utils";
import { conversionQueue } from "@/lib/utils/trigger-utils";
import { sendDocumentCreatedWebhook } from "@/lib/webhook/triggers/document-created";

export const config = {
  // in order to enable `waitUntil` function
  supportsResponseStreaming: true,
};

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
    const { query, sort } = req.query as { query?: string; sort?: string };
    const userId = (session.user as CustomUser).id;

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId: userId,
            },
          },
        },
      });

      if (!team) {
        return res.status(404).end("Team not found");
      }

      let orderBy: Prisma.DocumentOrderByWithRelationInput;
      switch (sort) {
        case "createdAt":
          orderBy = { createdAt: "desc" };
          break;
        case "views":
          orderBy = { views: { _count: "desc" } };
          break;
        case "name":
          orderBy = { name: "asc" };
          break;
        case "links":
          orderBy = { links: { _count: "desc" } };
          break;
        default:
          orderBy = { createdAt: "desc" };
      }

      const documents = await prisma.document.findMany({
        where: {
          teamId: teamId,
          ...(query && {
            name: {
              contains: query,
              mode: "insensitive",
            },
          }),
          ...(!(query || sort) && {
            folderId: null,
          }),
        },
        orderBy,
        include: {
          ...(sort &&
            sort === "lastViewed" && {
              views: {
                select: { viewedAt: true },
                orderBy: { viewedAt: "desc" },
                take: 1,
              },
            }),
          _count: {
            select: { links: true, views: true, versions: true },
          },
        },
      });

      let sortedDocuments = documents;

      if (sort === "lastViewed") {
        sortedDocuments = documents.sort((a, b) => {
          const aLastView = a.views[0]?.viewedAt;
          const bLastView = b.views[0]?.viewedAt;

          if (!aLastView) return 1;
          if (!bLastView) return -1;

          return bLastView.getTime() - aLastView.getTime();
        });
      }

      if (sort === "name") {
        sortedDocuments = documents.sort((a, b) =>
          a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
        );
      }

      return res.status(200).json(sortedDocuments);
    } catch (error) {
      errorhandler(error, res);
    }
  } else if (req.method === "POST") {
    // POST /api/teams/:teamId/documents

    const { teamId } = req.query as { teamId: string };

    // Check for API token first
    const authHeader = req.headers.authorization;
    let userId: string;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const hashedToken = hashToken(token);

      // Look up token in database
      const restrictedToken = await prisma.restrictedToken.findUnique({
        where: { hashedKey: hashedToken },
        select: { userId: true, teamId: true },
      });

      // Check if token exists
      if (!restrictedToken) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check if token is for the correct team
      if (restrictedToken.teamId !== teamId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      userId = restrictedToken.userId;
    } else {
      // Fall back to session auth
      const session = await getServerSession(req, res, authOptions);
      if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      userId = (session.user as CustomUser).id;
    }

    // Assuming data is an object with `name` and `description` properties
    const {
      name,
      url: fileUrl,
      storageType,
      numPages,
      type: fileType,
      folderPathName,
      contentType,
      createLink,
      fileSize,
    } = req.body as {
      name: string;
      url: string;
      storageType: DocumentStorageType;
      numPages?: number;
      type?: string;
      folderPathName?: string;
      contentType: string;
      createLink?: boolean;
      fileSize?: number;
    };

    try {
      const { team } = await getTeamWithUsersAndDocument({
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
          if (!pageId) {
            throw new Error("Notion page not found");
          }
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

      // determine if the document is download only
      const isDownloadOnly = type === "zip" || type === "map";

      // Save data to the database
      const document = await prisma.document.create({
        data: {
          name: name,
          numPages: numPages,
          file: fileUrl,
          originalFile: fileUrl,
          contentType: contentType,
          type: type,
          storageType,
          ownerId: userId,
          teamId: teamId,
          downloadOnly: isDownloadOnly,
          ...(createLink && {
            links: {
              create: {
                teamId,
              },
            },
          }),
          versions: {
            create: {
              file: fileUrl,
              originalFile: fileUrl,
              contentType: contentType,
              type: type,
              storageType,
              numPages: numPages,
              isPrimary: true,
              versionNumber: 1,
              fileSize: fileSize,
            },
          },
          folderId: folder?.id ? folder.id : null,
        },
        include: {
          links: true,
          versions: true,
        },
      });

      if (type === "docs" || type === "slides") {
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

      if (type === "cad") {
        await convertCadToPdfTask.trigger(
          {
            documentId: document.id,
            documentVersionId: document.versions[0].id,
            teamId,
          },
          {
            idempotencyKey: `${teamId}-${document.versions[0].id}-cad`,
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

      if (type === "video") {
        await processVideo.trigger(
          {
            videoUrl: fileUrl,
            teamId,
            docId: fileUrl.split("/")[1], // Extract doc_xxxx from teamId/doc_xxxx/filename
            documentVersionId: document.versions[0].id,
            fileSize: fileSize || 0,
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

      // skip triggering convert-pdf-to-image job for "notion" / "excel" documents
      if (type === "pdf") {
        await convertPdfToImageRoute.trigger(
          {
            documentId: document.id,
            documentVersionId: document.versions[0].id,
            teamId,
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

      waitUntil(
        sendDocumentCreatedWebhook({
          teamId,
          data: {
            document_id: document.id,
          },
        }),
      );

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
