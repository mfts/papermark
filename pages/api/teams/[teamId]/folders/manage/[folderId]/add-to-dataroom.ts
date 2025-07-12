import { NextApiRequest, NextApiResponse } from "next";

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
  documents: { id: string }[];
  childFolders: FolderWithContents[];
}

async function fetchFolderContents(
  folderId: string,
): Promise<FolderWithContents> {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: {
      documents: { select: { id: true } },
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
          documentId: doc.id,
          dataroomId,
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

export default createTeamHandler({
  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId, folderId } = req.query as {
      teamId: string;
      folderId: string;
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
              id: dataroomId,
            },
          },
          folders: {
            some: {
              id: {
                equals: folderId,
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

      if (team.plan === "free" || team.plan === "pro") {
        res.status(403).json({
          message: "Upgrade your plan to use datarooms.",
        });
        return;
      }

      try {
        const folderContents = await fetchFolderContents(folderId);
        await createDataroomStructure(dataroomId, folderContents);

        // const folderWithDocuments = await prisma.folder.findUnique({
        //   where: {
        //     id: folderId,
        //   },
        //   include: {
        //     childFolders: true,
        //     documents: { select: { id: true } },
        //   },
        // });

        // if (!folderWithDocuments) {
        //   return res.status(404).json({
        //     message: "Folder not found.",
        //   });
        // }

        // const parentPath = "/" + slugify(folderWithDocuments.name);
        // await prisma.dataroomFolder.create({
        //   data: {
        //     dataroomId: dataroomId,
        //     path: parentPath,
        //     name: folderWithDocuments.name,
        //     documents: {
        //       create: folderWithDocuments.documents.map((document) => ({
        //         documentId: document.id,
        //         dataroomId: dataroomId,
        //       })),
        //     },
        //     childFolders: {
        //       create: folderWithDocuments.childFolders.map((childFolder) => ({
        //         name: childFolder.name,
        //         dataroomId: dataroomId,
        //         path: parentPath + "/" + slugify(childFolder.name),
        //         documents:...
        //       })),
        //     },
        //   },
        // });
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
  },
});
