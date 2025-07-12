import { NextApiResponse } from "next";

import slugify from "@sindresorhus/slugify";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

interface FolderWithContents {
  id: string;
  name: string;
  documents: { documentId: string }[];
  childFolders: FolderWithContents[];
}

async function fetchFolderContents(
  folderId: string,
): Promise<FolderWithContents> {
  const folder = await prisma.dataroomFolder.findUnique({
    where: { id: folderId },
    include: {
      documents: { select: { documentId: true } },
      childFolders: true,
    },
  });

  if (!folder) {
    throw new Error(`Folder with id ${folderId} not found`);
  }

  const childFolders = await Promise.all(
    folder.childFolders.map((childFolder) =>
      fetchFolderContents(childFolder.id),
    ),
  );

  return {
    id: folder.id,
    name: folder.name,
    documents: folder.documents,
    childFolders: childFolders,
  };
}

async function createDataroomStructure(
  dataroomId: string,
  folder: FolderWithContents,
  parentPath: string = "",
  parentFolderId?: string,
): Promise<void> {
  const currentPath = `${parentPath}/${slugify(folder.name)}`;

  const dataroomFolder = await prisma.dataroomFolder.create({
    data: {
      dataroomId,
      path: currentPath,
      name: folder.name,
      parentId: parentFolderId,
      documents: {
        create: folder.documents.map((doc) => ({
          documentId: doc.documentId,
          dataroomId: dataroomId,
        })),
      },
    },
  });

  await Promise.all(
    folder.childFolders.map((childFolder) =>
      createDataroomStructure(
        dataroomId,
        childFolder,
        currentPath,
        dataroomFolder.id,
      ),
    ),
  );
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // POST /api/teams/:teamId/dataroomId/:id/folders/manage/:folderId/dataroom-to-dataroom
  const {
    teamId,
    folderId,
    id: roomId,
  } = req.query as {
    teamId: string;
    folderId: string;
    id: string;
  };
  const { dataroomId } = req.body as { dataroomId: string };

  try {
    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
        users: {
          some: {
            userId: req.user.id,
          },
        },
        datarooms: {
          some: {
            id: roomId,
            folders: {
              some: {
                id: {
                  equals: folderId,
                },
              },
            },
          },
        },
      },
      select: {
        id: true,
        plan: true,
      },
    });

    if (!team) {
      res.status(401).end("Unauthorized");
      return;
    }

    if (
      (team.plan === "free" || team.plan === "pro") &&
      !team.plan.includes("drtrial")
    ) {
      res.status(403).json({
        message: "Upgrade your plan to use datarooms.",
      });
      return;
    }

    try {
      const folderContents = await fetchFolderContents(folderId);
      await createDataroomStructure(dataroomId, folderContents);
    } catch (error) {
      res.status(500).json({
        message: "Document already exists in dataroom!",
      });
      return;
    }

    res.status(200).json({
      message: "Folder added to dataroom!",
    });
  } catch (error) {
    errorhandler(error, res);
  }
}

export default createTeamHandler({
  POST: handler,
});
