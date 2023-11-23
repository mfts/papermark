import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]";
import { log } from "@/lib/utils";
import z from "zod";

const bodySchema = z.object({
  folderName: z.string().max(30), //Folder name should be less than 30 words
  dataroomId: z.string(),
  parentFolderId: z.string()
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

    const id = req.body.id;
    try {

      //Delete the folder
      const folder = await prisma.dataroomFolder.delete({
        where: {
          id: id
        }
      })

      res.status(200).json({ folder });
    } catch (error) {
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
    try {
      ({ folderName, dataroomId, parentFolderId } = bodySchema.parse(req.body));
    } catch (error) {
      res.status(400).json({
        message: "Invalid Inputs",
        error: (error as Error).message,
      });
      return;
    }

    try {
      const folder = await prisma.dataroomFolder.create({
        data: {
          name: folderName,
          parentFolderId,
          dataroomId
        }
      });

      res.status(201).json({ folder });
    } catch (error) {
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
       res.status(401).end("Unauthorized");
       return;
     }
 
     //Input validation 
     const { updatedFolderName, folderId } = req.body;
     if (updatedFolderName.length > 150) {
      res.status(400).json({
        message: "Invalid Inputs",
        error: "Please enter a folder name with fewer than 150 characters",
      });
      return;
     }
    
     //Update folder name
     try {
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