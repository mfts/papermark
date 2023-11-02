import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { del } from "@vercel/blob";
import { getExtension } from "@/lib/utils";
import { client } from "@/trigger";
import { identifyUser, trackAnalytics } from "@/lib/analytics";

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
        include: {
          // Get the latest primary version of the document
          versions: {
            where: { isPrimary: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        }
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
  } else if (req.method === "PUT") {
    // PUT /api/documents/:id
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { id } = req.query as { id: string };

    const { name, url, numPages } = req.body;

    try {
      const document = await prisma.document.findUnique({
        where: {
          id: id,
        },
        select: {
          ownerId: true,
          type: true,
          versions: {
            where: { isPrimary: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      // Check if the user is the owner of the document
      if (document?.ownerId !== (session.user as CustomUser).id) {
        return res.status(401).end("Unauthorized");
      }

      const updatedDocument = await prisma.document.update({
        where: {
          id: id,
        },
        data: {
          name: name,
          numPages: numPages,
          file: url,
          versions: {
            updateMany: {
              where: {
                isPrimary: true,
              },
              data: {
                isPrimary: false,
              },
            },
            create: {
              file: url,
              type: document.type,
              numPages: numPages,
              isPrimary: true,
              versionNumber: document.versions[0].versionNumber + 1,
            },
          },
        },
        include: {
          _count: {
            select: { links: true, views: true, versions: true },
          },
          links: {
            take: 1,
            select: { id: true },
          },
          versions: {
            where: { isPrimary: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      // trigger document uploaded event to trigger convert-pdf-to-image job
      await client.sendEvent({
        name: "document.uploaded",
        payload: { documentVersionId: updatedDocument.versions[0].id },
      });

      res.status(200).json(updatedDocument);
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
      await del(document.file)
      // delete the document from database
      await prisma.document.delete({
        where: {
          id: id,
        },
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
    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
