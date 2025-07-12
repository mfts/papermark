import { NextApiResponse } from "next";

import { getLimits } from "@/ee/limits/server";
import { DataroomFolder, Document, Folder } from "@prisma/client";

import { newId } from "@/lib/id-helper";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

// Define types
interface FolderWithContents extends Folder {
  documents: Omit<Document, "folderId">[];
  childFolders: Omit<FolderWithContents, "parentId">[];
}

// Recursive function to fetch all folders, child folders, and documents
async function fetchFolderContents(
  folderId: string,
): Promise<FolderWithContents> {
  const folder = await prisma.folder.findUnique({
    where: {
      id: folderId,
    },
    include: {
      documents: true,
      childFolders: true,
    },
  });

  if (!folder) {
    throw new Error(`Folder with id ${folderId} not found`);
  }

  const childFolders = await Promise.all(
    folder.childFolders.map(async (childFolder) => {
      const nestedChildFolders = await fetchFolderContents(childFolder.id);
      return nestedChildFolders;
    }),
  );

  // Remove parentId from top-level child folders and folderId from top-level documents
  const modifiedDocuments = folder.documents.map((doc) => {
    return {
      ...doc,
      folderId: null,
    };
  });

  const modifiedChildFolders = childFolders.map((childFolder) => {
    return {
      ...childFolder,
      parentId: null,
      childFolders: childFolder.childFolders,
      documents: childFolder.documents,
    };
  });

  return {
    ...folder,
    documents: modifiedDocuments,
    childFolders: modifiedChildFolders,
  };
}

// Recursive function to create data room folders and documents
async function createDataroomFolders(
  dataroomId: string,
  folder: Omit<FolderWithContents, "parentId">,
  originalBasePath: string,
  parentFolderId?: string,
) {
  let dataroomFolder: DataroomFolder | undefined = undefined;
  if (originalBasePath !== folder.path) {
    // Skip the root folder

    dataroomFolder = await prisma.dataroomFolder.create({
      data: {
        name: folder.name,
        path: folder.path.replace(originalBasePath, ""),
        parentId: parentFolderId,
        dataroomId: dataroomId,
      },
    });

    // Create documents for the current folder
    await Promise.allSettled(
      folder.documents.map((doc) => {
        return prisma.dataroomDocument.create({
          data: {
            documentId: doc.id,
            dataroomId: dataroomId,
            folderId: dataroomFolder?.id,
          },
        });
      }),
    );
  }

  // Create child folders recursively
  await Promise.allSettled(
    folder.childFolders.map((childFolder) =>
      createDataroomFolders(
        dataroomId,
        childFolder,
        originalBasePath,
        dataroomFolder?.id,
      ),
    ),
  );
}

export default createTeamHandler({
  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // POST /api/teams/:teamId/datarooms/create-from-folder
    const { folderId } = req.body as { folderId: string };

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: req.team!.id,
        },
        select: {
          id: true,
          plan: true,
          _count: {
            select: {
              datarooms: true,
            },
          },
        },
      });

      if (!team) {
        res.status(401).end("Unauthorized");
        return;
      }

      const limits = await getLimits({
        teamId: req.team!.id,
        userId: req.user.id,
      });
      const stripedTeamPlan = team.plan.replace("+old", "");

      if (
        !team.plan.includes("drtrial") &&
        ["business", "datarooms", "datarooms-plus"].includes(stripedTeamPlan) &&
        limits &&
        team._count.datarooms >= limits.datarooms
      ) {
        res.status(403).json({
          message:
            "You've reached the limit of datarooms. Consider upgrading your plan.",
        });
        return;
      }

      if (team.plan.includes("drtrial") && team._count.datarooms > 0) {
        res.status(400).json({ message: "Trial data room already exists" });
        return;
      }

      if (
        ["free", "pro"].includes(team.plan) &&
        !team.plan.includes("drtrial")
      ) {
        res
          .status(400)
          .json({ message: "You need a Business plan to create a data room" });
        return;
      }

      // Fetch the folder structure
      const folderContents = await fetchFolderContents(folderId);

      // Create the data room
      const pId = newId("dataroom");
      const dataroom = await prisma.dataroom.create({
        data: {
          pId: pId,
          name: folderContents.name,
          teamId: req.team!.id,
          documents: {
            create: folderContents.documents.map((doc) => ({
              documentId: doc.id,
            })),
          },
          folders: {
            create: [],
          },
        },
        select: { id: true },
      });

      // Start the recursive creation with the root folder
      await createDataroomFolders(
        dataroom.id,
        folderContents,
        folderContents.path,
      );

      const dataroomWithCount = await prisma.dataroom.findUnique({
        where: {
          id: dataroom.id,
        },
        include: {
          _count: { select: { documents: true } },
        },
      });

      res.status(201).json(dataroomWithCount);
    } catch (error) {
      console.error("Request error", error);
      res.status(500).json({ error: "Error creating dataroom" });
    }
  },
});
