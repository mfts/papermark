import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import {
  DocumentApprovalStatus,
  DocumentStorageType,
  Prisma,
  Viewer,
  ViewType,
} from "@prisma/client";
import slugify from "@sindresorhus/slugify";
import { getServerSession } from "next-auth/next";
import { parsePageId } from "notion-utils";

import { hashToken } from "@/lib/api/auth/token";
import { errorhandler } from "@/lib/errorHandler";
import { newId } from "@/lib/id-helper";
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
          viewer: {
            select: {
              email: true,
            },
          },
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
    // POST /api/teams/:teamId/documents/viewer/:id

    const { teamId, viewerId } = req.query as {
      teamId: string;
      viewerId?: string;
    };

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        users: {
          select: {
            userId: true,
          },
        },
      },
    });
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const viewer = await prisma.viewer.findUnique({
      where: { id: viewerId, teamId: teamId },
    });

    if (!viewer) {
      return res.status(404).json({ error: "Viewer not found" });
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
      approvalStatus,
      uploadedViaLinkId,
      dataroomId,
      viewId,
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
      approvalStatus?: DocumentApprovalStatus;
      uploadedViaLinkId?: string;
      dataroomId?: string;
      viewId: string;
    };

    try {
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

      let folder;
      if (folderPathName && !dataroomId) {
        folder = await prisma.folder.findUnique({
          where: {
            teamId_path: {
              teamId,
              path: folderPathName,
            },
          },
          select: {
            id: true,
          },
        });
      }
      console.log("folder", folder);

      if (!folder && !dataroomId) {
        folder = await prisma.folder.findUnique({
          where: {
            teamId_path: {
              teamId,
              path: "/" + slugify(viewer.email.split("@")[0]),
            },
          },
          select: {
            id: true,
          },
        });
        if (!folder) {
          const newFolder = await prisma.folder.create({
            data: {
              name: viewer.email.split("@")[0],
              path: "/" + slugify(viewer.email.split("@")[0]),
              parentId: null,
              teamId: teamId,
            },
          });

          folder = newFolder;
        }
      }

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
          ownerId: null,
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
          approvalStatus: approvalStatus,
          uploadedViaLinkId: uploadedViaLinkId,
          viewerId: viewer.id,
        },
        include: {
          links: true,
          versions: true,
        },
      });
      const view = await prisma.view.findUnique({
        where: {
          id: viewId,
          linkId: uploadedViaLinkId,
          viewType: { equals: ViewType.FILE_REQUEST_VIEW },
        },
      });

      // update the viewer to include the document id
      if (view) {
        const data = await prisma.view.update({
          where: { id: view.id },
          data: { uploadDocumentIds: [...(view?.uploadDocumentIds || []), document.id] },
        });
      }

      if (dataroomId && folderPathName) {
        const dataroomFolder = await prisma.dataroomFolder.findUnique({
          where: {
            dataroomId_path: {
              dataroomId,
              path: folderPathName,
            },
          },
        });
        const dataroomDocument = await prisma.dataroomDocument.create({
          data: {
            documentId: document.id,
            dataroomId,
            folderId: dataroomFolder?.id,
          },
        });
      }

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
