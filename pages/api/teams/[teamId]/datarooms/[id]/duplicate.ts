import { NextApiResponse } from "next";

import { getLimits } from "@/ee/limits/server";
import {
  Dataroom,
  DataroomBrand,
  DataroomDocument,
  DataroomFolder,
} from "@prisma/client";

import { newId } from "@/lib/id-helper";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

interface DataroomWithContents extends Dataroom {
  documents: DataroomDocument[];
  folders: DataroomFolderWithContents[];
  brand: Partial<DataroomBrand> | null;
}

interface DataroomFolderWithContents extends DataroomFolder {
  documents: DataroomDocument[];
  childFolders: DataroomFolderWithContents[];
}

// Function to fetch the existing data room structure
async function fetchDataroomContents(
  dataroomId: string,
): Promise<DataroomWithContents> {
  const dataroom = await prisma.dataroom.findUnique({
    where: { id: dataroomId },
    include: {
      documents: true,
      folders: {
        where: { parentId: null }, // Only get root folders initially
        include: { documents: true },
      },
      brand: true,
    },
  });

  if (!dataroom) {
    throw new Error(`Dataroom with id ${dataroomId} not found`);
  }

  // Recursive function to fetch folder contents
  async function getFolderContents(
    folderId: string,
  ): Promise<DataroomFolderWithContents> {
    const folder = await prisma.dataroomFolder.findUnique({
      where: { id: folderId },
      include: {
        documents: true,
        childFolders: {
          include: { documents: true },
        },
      },
    });

    if (!folder) {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    const childFolders = await Promise.all(
      folder.childFolders.map(async (childFolder) => {
        const nestedContents = await getFolderContents(childFolder.id);
        return nestedContents;
      }),
    );

    return {
      ...folder,
      documents: folder.documents,
      childFolders: childFolders,
    };
  }

  // Transform root folders by fetching their complete contents
  const foldersWithContents = await Promise.all(
    dataroom.folders.map((folder) => getFolderContents(folder.id)),
  );

  return {
    ...dataroom,
    documents: dataroom.documents.filter((doc) => !doc.folderId),
    folders: foldersWithContents,
    brand: dataroom.brand,
  };
}

// Recursive function to duplicate folders and documents
async function duplicateFolders(
  dataroomId: string,
  folder: DataroomFolderWithContents,
  parentFolderId?: string,
) {
  const newFolder = await prisma.dataroomFolder.create({
    data: {
      name: folder.name,
      path: folder.path,
      parentId: parentFolderId,
      dataroomId: dataroomId,
    },
    select: { id: true },
  });

  // Duplicate documents for the current folder
  await Promise.allSettled(
    folder.documents.map((doc) =>
      prisma.dataroomDocument.create({
        data: {
          documentId: doc.documentId,
          dataroomId: dataroomId,
          folderId: newFolder.id,
        },
      }),
    ),
  );

  // Duplicate child folders recursively
  await Promise.allSettled(
    folder.childFolders.map((childFolder) =>
      duplicateFolders(dataroomId, childFolder, newFolder.id),
    ),
  );
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // POST /api/teams/:teamId/datarooms/:id/duplicate
  const { id: dataroomId } = req.query as {
    id: string;
  };

  try {
    const team = req.team;

    if (team.plan.includes("drtrial")) {
      res.status(403).json({
        message:
          "You've reached the limit of datarooms. Consider upgrading your plan.",
      });
      return;
    }

    const dataroom = await prisma.dataroom.findUnique({
      where: {
        id: dataroomId,
        teamId: team.id,
      },
      select: { id: true },
    });

    if (!dataroom) {
      res.status(404).json({ message: "Dataroom not found" });
      return;
    }

    // Check if the team has reached the limit of datarooms
    const limits = await getLimits({ teamId: team.id, userId: req.user.id });
    if (limits && (team._count?.datarooms ?? 0) >= limits.datarooms) {
      console.log(
        "Dataroom limit reached",
        limits.datarooms,
        team._count?.datarooms ?? 0,
      );
      res.status(400).json({
        message:
          "You've reached the limit of datarooms. Consider upgrading your plan.",
      });
      return;
    }

    // Fetch the existing data room structure
    const dataroomContents = await fetchDataroomContents(dataroomId);

    // Create a new data room
    const pId = newId("dataroom");
    const newDataroom = await prisma.dataroom.create({
      data: {
        pId: pId,
        name: dataroomContents.name + " (Copy)",
        teamId: dataroomContents.teamId,
        documents: {
          create: dataroomContents.documents.map((doc) => ({
            documentId: doc.documentId,
          })),
        },
        folders: {
          create: [],
        },
        brand: {
          create: {
            banner: dataroomContents.brand?.banner,
            logo: dataroomContents.brand?.logo,
            accentColor: dataroomContents.brand?.accentColor,
            brandColor: dataroomContents.brand?.brandColor,
          },
        },
      },
    });

    // Changed this section to properly await all folder duplications
    await Promise.all(
      dataroomContents.folders
        .filter((folder) => !folder.parentId)
        .map((folder) => duplicateFolders(newDataroom.id, folder)),
    );

    res.status(201).json(newDataroom);
  } catch (error) {
    console.error("Request error", error);
    res.status(500).json({ message: "Error duplicating dataroom" });
  }
}

export default createTeamHandler({
  POST: handler,
}, { includeCounts: true });
