import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../../../auth/[...nextauth]";
import { CustomUser, FolderDirectory } from "@/lib/types";
import { DataroomFolder } from "@prisma/client";
import { Session } from "next-auth";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // GET /api/datarooms/hierarchical-datarooms/:id
    const session: Session | null = req.headers.authorization ? await JSON.parse(req.headers.authorization as string) : await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { id } = req.query as { id: string };

    try {
      const dataroom = await prisma.hierarchicalDataroom.findUnique({
        where: {
          id: id,
        }
      });

      if (!dataroom) {
        return res.status(404).end("Dataroom not found");
      }

      // Check that the user is owner of the dataroom, otherwise return 401
      if (dataroom.ownerId !== (session.user as CustomUser).id) {
        return res.status(401).end("Unauthorized to access this document");
      }
      
      //We want to minimize database calls as processing data on server
      //is more efficient
      const folders = await prisma.dataroomFolder.findMany({
        where: {
          dataroomId: id
        }
      })

      const files = await prisma.dataroomFile.findMany({
        where: {
          dataroomId: id
        }
      })

      //Create FolderDirectory data structure
      const homeFolder = folders.find(folder => !folder.parentFolderId) as DataroomFolder;
      let folderDirectory: FolderDirectory = {};
      let folderQueue: string[] = [];
      folderQueue.push(homeFolder.id);
      while (folderQueue.length !== 0) {
        const folderId = folderQueue.pop() as string;
        const currFolder = folders.find(folder => folder.id === folderId) as DataroomFolder;
        folderDirectory[folderId] = {
          name: currFolder.name,
          subfolders: folders.filter(folder => folder.parentFolderId === currFolder.id).map(folder => folder.id),
          files: files.filter(file => file.parentFolderId === currFolder.id),
          href: currFolder.parentFolderId 
          ? folderDirectory[currFolder.parentFolderId].href + `/${currFolder.id}`
          : `/${currFolder.id}`,
        }
        folderQueue = [...folderQueue, ...folderDirectory[folderId].subfolders];
      }

      return res.status(200).json({ dataroom, folderDirectory });
    } catch (error) {
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else if (req.method === "DELETE") {
    // DELETE /api/datarooms/:id
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const { id } = req.query as { id: string };

    try {
      const dataroom = await prisma.dataroom.findUnique({
        where: {
          id: id,
        }
      });

      if (!dataroom) {
        return res.status(404).end("Dataroom not found");
      }

      // check that the user is owner of the dataroom, otherwise return 401
      if (dataroom.ownerId !== (session.user as CustomUser).id) {
        return res.status(401).end("Unauthorized to access the document");
      }

      // delete the dataroom from database
      await prisma.dataroom.delete({
        where: {
          id: id
        }
      })

      res.status(204).end(); // 204 No Content response for successful deletes
    } catch (error) {
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }

  } else {
    // We only allow GET and DELETE requests
    res.setHeader("Allow", ["GET", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
