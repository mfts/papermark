import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]";
import { log } from "@/lib/utils";
import z from "zod";
import { isUserMemberOfTeam } from "@/lib/team/helper";
import { CustomUser } from "@/lib/types";
import { TeamError } from "@/lib/errorHandler";
import { ZodError } from "zod";

const bodySchema = z.object({
  folderName: z.string().max(30), //Folder name should be less than 30 words
  dataroomId: z.string(),
  parentFolderId: z.string(),
  teamId: z.string()
})

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "DELETE") {
    // GET /api/datarooms/hierarchical/folders
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, folderId } = req.body;
    const userId = (session?.user as CustomUser).id;
    try {
      //Check if user if member of team
      await isUserMemberOfTeam({ teamId, userId });
      const folder = await prisma.dataroomFolder.delete({
        where: {
          id: folderId
        }
      })

      res.status(200).json({ folder });
    } catch (error) {
      if (error instanceof TeamError) {
        return res.status(401).json({ message: "Unauthorized access" });
      }
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else if (req.method === "POST") {
    // POST /api/datarooms/hierarchical/folders
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    //Input validation 
    let folderName: string;
    let dataroomId: string;
    let parentFolderId: string;
    let teamId: string;

    const userId = (session?.user as CustomUser).id;
    try {
      //Input validation
      ({ folderName, dataroomId, parentFolderId, teamId } = bodySchema.parse(req.body));
      //Check if user if member of team
      await isUserMemberOfTeam({ teamId, userId });
      const folder = await prisma.dataroomFolder.create({
        data: {
          name: folderName,
          parentFolderId,
          dataroomId
        }
      });

      res.status(201).json({ folder });
    } catch (error) {
      if (error instanceof TeamError) {
        return res.status(401).json({ message: "Unauthorized access" });
      } else if (error instanceof ZodError) {
        return res.status(403).json({
          message: "Invalid Inputs",
          error: "Please enter a folder name with fewer than 150 characters",
        });
      }
      log(`Failed to create folder. Error: \n\n ${error}`)
      res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else if (req.method === "PUT"){
    // PUT /api/datarooms/hierarchical/folders
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }
    const { updatedFolderName, folderId, teamId } = req.body;
    
    //Update folder name
    const userId = (session?.user as CustomUser).id;
    try {
      //Input validation (Max no of words = 150)
      z.string().max(150).parse(updatedFolderName);
      //Check if user if member of team
      await isUserMemberOfTeam({ teamId, userId });
      const folder = await prisma.dataroomFolder.update({
        where: {
          id: folderId
        },
        data: {
          name: updatedFolderName
        }
      });
      res.status(201).json({ folder, message: "Folder renamed successfully" });
    } catch (error) {
      if (error instanceof TeamError) {
        return res.status(401).json({ message: "Unauthorized access" });
      } else if (error instanceof ZodError) {
        return res.status(403).json({
          message: "Invalid Inputs",
          error: "Please enter a folder name with fewer than 150 characters",
        });
      }
      log(`Failed to create folder. Error: \n\n ${error}`)
      res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else {
    // We only allow POST, DELETE AND PUT requests
    res.setHeader("Allow", ["DELETE", "POST", "PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}