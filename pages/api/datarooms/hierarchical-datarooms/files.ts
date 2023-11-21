import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]";
import { log } from "@/lib/utils";
import z from "zod";

const bodySchema = z.object({
  fileName: z.string().max(30), //File name should be less than 30 words
  dataroomId: z.string(),
  parentFolderId: z.string(),
  url: z.string()
})

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "DELETE") {
    // GET /api/datarooms/hierarchical-datarooms/files
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const id = req.body.id;
    try {
      const file = await prisma.dataroomFile.delete({
        where: {
          id: id
        }
      })

      res.status(200).json({ file });
    } catch (error) {
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else if (req.method === "POST") {
    // POST /api/datarooms/hierarchical-datarooms/files
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    //Input validation 
    let fileName: string;
    let dataroomId: string;
    let parentFolderId: string;
    let url: string
    try {
      ({ fileName, dataroomId, parentFolderId, url } = bodySchema.parse(req.body));
    } catch (error) {
      res.status(400).json({
        message: "Invalid Inputs",
        error: (error as Error).message,
      });
      return;
    }

    try {
      const file = await prisma.dataroomFile.create({
        data: {
          name: fileName,
          parentFolderId,
          dataroomId,
          url
        }
      });

      res.status(201).json({ file });
    } catch (error) {
      log(`Failed to create folder. Error: \n\n ${error}`)
      res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else if (req.method === "PUT"){
    // PUT /api/datarooms/hierarchical-datarooms/files
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    //Input validation 
    const { updatedFileName, fileId } = req.body;
    if (updatedFileName.length > 150) {
     res.status(400).json({
       message: "Invalid Inputs",
       error: "Please enter a file name with fewer than 150 characters",
     });
     return;
    }
   
    //Update file name
    try {
      const file = await prisma.dataroomFile.update({
       where: {
         id: fileId
       },
       data: {
         name: updatedFileName
       }
      });

      res.status(201).json({ file });
    } catch (error) {
      log(`Failed to create file. Error: \n\n ${error}`)
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