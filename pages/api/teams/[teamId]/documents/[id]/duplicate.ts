import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { DocumentVersion } from "@prisma/client";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import { copyFileServer } from "@/lib/files/copy-file-server";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // GET /api/teams/:teamId/documents/:id/duplicate
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, id: docId } = req.query as { teamId: string; id: string };

    const userId = (session.user as CustomUser).id;

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId,
            },
          },
          documents: {
            some: {
              id: {
                equals: docId,
              },
            },
          },
        },
        select: {
          id: true,
        },
      });

      if (!team) {
        return res.status(401).end("Unauthorized");
      }

      const document = await prisma.document.findUnique({
        where: {
          id: docId,
        },
        include: {
          versions: {
            where: { isPrimary: true },
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              pages: true,
            },
          },
        },
      });

      if (!document) {
        return res.status(404).end("Document not found");
      }

      const { documentId, ...documentVersion } = document.versions[0];

      const { type, data } = await copyFileServer({
        teamId: teamId,
        filePath: documentVersion.file,
        fileName: document.name,
        storageType: documentVersion.storageType,
      });

      await prisma.document.create({
        data: {
          ...document,
          name: `${document.name} (Copy)`,
          id: undefined,
          teamId: teamId,
          ownerId: userId,
          assistantEnabled: false,
          createdAt: undefined,
          updatedAt: undefined,
          file: document.file.replace(data?.fromLocation!, data?.toLocation!),
          versions: {
            create: {
              ...documentVersion,
              id: undefined,
              versionNumber: 1,
              createdAt: undefined,
              updatedAt: undefined,
              fileId: undefined,
              file: documentVersion.file.replace(
                data?.fromLocation!,
                data?.toLocation!,
              ),
              pages: {
                createMany: {
                  data: documentVersion.pages.map((page) => ({
                    ...page,
                    id: undefined,
                    file: page.file.replace(
                      data?.fromLocation!,
                      data?.toLocation!,
                    ),
                    metadata: page.metadata ?? {},
                    pageLinks: page.pageLinks ?? [],
                    versionId: undefined,
                    createdAt: undefined,
                    updatedAt: undefined,
                  })),
                },
              },
            },
          },
        },
      });

      return res.status(200).json({
        message: "Document duplicated successfully!",
      });
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
