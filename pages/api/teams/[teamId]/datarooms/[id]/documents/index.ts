import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { client } from "@/trigger";
import { DataroomDocument, Document } from "@prisma/client";
import slugify from "@sindresorhus/slugify";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import { newId } from "@/lib/id-helper";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/datarooms/:id/documents
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const userId = (session.user as CustomUser).id;
    const { teamId, id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };

    try {
      // Check if the user is part of the team
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
        return res.status(401).end("Unauthorized");
      }

      const documents = await prisma.dataroomDocument.findMany({
        where: {
          dataroomId: dataroomId,
          folderId: null,
        },
        orderBy: {
          document: {
            name: "asc",
          },
        },
        include: {
          document: {
            select: {
              id: true,
              name: true,
              type: true,
              _count: {
                select: {
                  views: { where: { dataroomId } },
                  versions: true,
                },
              },
            },
          },
        },
      });

      const documentsWithCount = documents.map((document) => ({
        ...document,
        document: { ...document.document },
      }));

      // Sort documents by name considering the numerical part
      documentsWithCount.sort((a, b) => {
        const getNumber = (str: string): number => {
          const match = str.match(/^\d+/);
          return match ? parseInt(match[0], 10) : 0;
        };

        const numA = getNumber(a.document.name);
        const numB = getNumber(b.document.name);

        if (numA !== numB) {
          return numA - numB;
        }

        // If numerical parts are the same, fall back to lexicographical order
        return a.document.name.localeCompare(b.document.name);
      });

      return res.status(200).json(documentsWithCount);
    } catch (error) {
      console.error("Request error", error);
      return res
        .status(500)
        .json({ error: "Error fetching documents from dataroom" });
    }
  } else if (req.method === "POST") {
    // POST /api/teams/:teamId/datarooms/:id/documents
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const { teamId, id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };

    const userId = (session.user as CustomUser).id;

    // Assuming data is an object with `name` and `description` properties
    const { documentId, folderPathName } = req.body as {
      documentId: string;
      folderPathName?: string;
    };

    try {
      // Check if the user is part of the team
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
        return res.status(401).end("Unauthorized");
      }

      const folder = await prisma.dataroomFolder.findUnique({
        where: {
          dataroomId_path: {
            dataroomId,
            path: "/" + folderPathName,
          },
        },
        select: {
          id: true,
        },
      });

      const document = await prisma.dataroomDocument.create({
        data: {
          documentId,
          dataroomId,
          folderId: folder?.id,
        },
        include: {
          dataroom: {
            select: {
              links: {
                select: { id: true },
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
      });

      // trigger `dataroom.new_document` event to notify existing viewers
      // await client.sendEvent({
      //   name: "dataroom.new_document",
      //   payload: {
      //     dataroomId: dataroomId,
      //     dataroomDocumentId: document.id,
      //     linkId: document.dataroom.links[0].id ?? "",
      //     senderUserId: userId,
      //   },
      // });

      return res.status(201).json(document);
    } catch (error) {
      log({
        message: `Failed to create dataroom document. \n\n*teamId*: _${teamId}_, \n\n*dataroomId*: ${dataroomId} \n\n ${error}`,
        type: "error",
      });
      errorhandler(error, res);
    }
  } else {
    // We only allow GET requests
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
