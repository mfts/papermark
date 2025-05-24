import { NextApiRequest, NextApiResponse } from "next";
import { ParsedUrlQuery } from "querystring";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { ItemType } from "@prisma/client";

const parseQueryParams = (query: ParsedUrlQuery) => {
  return {
    teamId: query.teamId as string,
    dataroomId: query.id as string,
    rootOnly: query.root === "true",
  };
}

type FolderWithChildren = {
  id: string;
  name: string;
  path: string;
  parentId: string | null;
  dataroomId: string;
  orderIndex: number | null;
  removedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  documents: Array<{
    id: string;
    folderId: string | null;
    document: {
      id: string;
      name: string;
      type: string;
    };
  }>;
  childFolders: FolderWithChildren[];
};


export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { teamId, dataroomId, rootOnly } = parseQueryParams(req.query);

  if (req.method === "GET") {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

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
        return res.status(401).end("Unauthorized");
      }

      if (rootOnly) {
        const rootTrashItems = await prisma.trashItem.findMany({
          where: {
            parentId: null,
            dataroomId: dataroomId,
            itemType: {
              in: [ItemType.DATAROOM_FOLDER, ItemType.DATAROOM_DOCUMENT],
            },
          },
          orderBy: [{ deletedAt: "desc" }, { name: "asc" }],
          select: {
            id: true,
            itemType: true,
            parentId: true,
            trashPath: true,
            fullPath: true,
            itemId: true,
            dataroomFolder: true,
            dataroomDocument: {
              select: {
                id: true,
                removedAt: true,
                document: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
                  },
                },
              },
            },
          },
        });
        return res.status(200).json(rootTrashItems);
      }

      const trashItems = await prisma.trashItem.findMany({
        where: {
          dataroomId,
          itemType: {
            in: [ItemType.DATAROOM_FOLDER, ItemType.DATAROOM_DOCUMENT],
          },
        },
        orderBy: [{ deletedAt: "desc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          itemType: true,
          parentId: true,
          itemId: true,
          dataroomId: true,
          dataroomFolder: {
            select: {
              id: true,
              name: true,
              path: true,
              parentId: true,
              dataroomId: true,
              orderIndex: true,
              removedAt: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          dataroomDocument: {
            select: {
              id: true,
              folderId: true,
              document: {
                select: { id: true, name: true, type: true },
              },
            },
          },
        },
      });

      const folderMap = new Map<string, FolderWithChildren>();

      // First pass: collect and map folders from trashItems
      for (const item of trashItems) {
        if (item.itemType === ItemType.DATAROOM_FOLDER && item.dataroomFolder) {
          folderMap.set(item.dataroomFolder.id, {
            id: item.dataroomFolder.id,
            name: item.name,
            path: item.dataroomFolder.path,
            parentId: item.parentId,
            dataroomId: item.dataroomFolder.dataroomId,
            orderIndex: item.dataroomFolder.orderIndex,
            removedAt: item.dataroomFolder.removedAt,
            createdAt: item.dataroomFolder.createdAt,
            updatedAt: item.dataroomFolder.updatedAt,
            documents: [],
            childFolders: [],
          });
        }
      }

      // Second pass: add documents to their parent folders
      for (const item of trashItems) {
        if (item.itemType === ItemType.DATAROOM_DOCUMENT && item.dataroomDocument && item.parentId) {
          const parentFolderInMap = folderMap.get(item.parentId);
          if (parentFolderInMap && item.dataroomDocument.document) {
            parentFolderInMap.documents.push({
              id: item.dataroomDocument.id,
              folderId: item.dataroomDocument.folderId,
              document: {
                id: item.dataroomDocument.document.id,
                name: item.dataroomDocument.document.name,
                type: item.dataroomDocument.document.type || "file",
              },
            });
          }
        }
      }

      // Third pass: build hierarchy by linking childFolders
      const rootFolders: FolderWithChildren[] = [];
      folderMap.forEach((folder) => {
        if (folder.parentId && folderMap.has(folder.parentId)) {
          if (folder.id !== folder.parentId) {
            const parent = folderMap.get(folder.parentId)!;
            parent.childFolders.push(folder);
          }
        } else {
          rootFolders.push(folder);
        }
      });

      const finalTransformedItems: FolderWithChildren[] = [];
      for (const item of trashItems) {
        if (item.itemType === ItemType.DATAROOM_FOLDER && item.dataroomFolder && folderMap.has(item.dataroomFolder.id)) {
          finalTransformedItems.push(folderMap.get(item.dataroomFolder.id)!);
        }
      }
      // Remove duplicates that might arise if a folder is both a root and processed again. // [ optional ]
      const uniqueTransformedItems = Array.from(new Set(finalTransformedItems.map(f => f.id))).map(id => finalTransformedItems.find(f => f.id === id)!);

      return res.status(200).json(uniqueTransformedItems);
    } catch (error) {
      console.error("Request error", error);
      return res.status(500).json({ error: "Error fetching trash items" });
    }
  } else {
    // We only allow GET requests
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}