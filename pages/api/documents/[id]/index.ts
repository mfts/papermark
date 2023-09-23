import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { del } from "@vercel/blob";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // GET /api/documents/:id
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { id } = req.query as { id: string };

    try {
      const document = await prisma.document.findUnique({
        where: {
          id: id,
        },
      });

      if (!document) {
        return res.status(404).end("Document not found");
      }

      // Check that the user is owner of the document, otherwise return 401
      if (document.ownerId !== (session.user as CustomUser).id) {
        return res.status(401).end("Unauthorized to access this document");
      }

      return res.status(200).json(document);
    } catch (error) {
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else if (req.method === "DELETE") {
    // DELETE /api/document/:id
    const session = await getServerSession(req, res, authOptions);
    if (!session) { 
      res.status(401).end("Unauthorized");
      return;
    }

    const { id } = req.query as { id: string };

    try{
      const document = await prisma.document.findUnique({
        where: {
          id: id,
        },
      });
      
      if (!document) {
        return res.status(404).end("Document not found");
      }
      
      // check that the user is owner of the document, otherwise return 401
      if (document.ownerId !== (session.user as CustomUser).id) {
        return res.status(401).end("Unauthorized to access the document");
      }
  
      // delete the document from vercel blob 
      await del(document.file);

      // delete the document from database
      await prisma.document.delete({
        where: {
          id: id,
        }
      })
      
      // successfully deleted
      return res.status(200).json("Document deleted successfully");
    } catch (error) {
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }

  } else {
    // We only allow GET, DELETE and POST requests
    res.setHeader("Allow", ["GET", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
