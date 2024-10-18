import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { authOptions } from "../../../../auth/[...nextauth]";
import { deleteFile } from "@/lib/files/delete-file-server";

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/documents/:id
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, id: docId } = req.query as { teamId: string; id: string };
    const userId = (session.user as CustomUser).id;

    try {
      const document = await prisma.document.findFirst({
        where: {
          id: docId,
          teamId: teamId,
          team: {
            users: {
              some: {
                userId: userId,
              },
            },
          },
        },
        include: {
          versions: {
            where: { isPrimary: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      if (!document) {
        return res.status(404).end("Document not found");
      }

      return res.status(200).json(document);
    } catch (error) {
      errorhandler(error, res);
    }
  } else if (req.method === "PUT") {
    // PUT /api/teams/:teamId/documents/:id (For moving and archiving/unarchiving documents)
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const userId = (session.user as CustomUser).id;
    const { teamId, id: docId } = req.query as { teamId: string; id: string };
    const { folderId, currentPathName, isArchived } = req.body as {
      folderId?: string;
      currentPathName?: string;
      isArchived?: boolean; // Add this to handle archiving
    };

    try {
      // Handle document archiving/unarchiving
      if (typeof isArchived !== "undefined") {
        const updatedDocument = await prisma.document.update({
          where: {
            id: docId,
            teamId: teamId,
            team: {
              users: {
                some: {
                  userId: userId,
                  role: "ADMIN", // Ensure the user has admin rights
                },
              },
            },
          },
          data: {
            isArchived: isArchived, // Update the archive state
          },
        });

        return res.status(200).json({
          message: `Document ${isArchived ? "archived" : "unarchived"} successfully.`,
          document: updatedDocument,
        });
      }

      // If no archiving is done, move the document to another folder
      const document = await prisma.document.update({
        where: {
          id: docId,
          teamId: teamId,
          team: {
            users: {
              some: {
                role: "ADMIN",
                userId: userId,
              },
            },
          },
        },
        data: {
          folderId: folderId,
        },
        select: {
          folder: {
            select: {
              path: true,
            },
          },
        },
      });

      if (!document) {
        return res.status(404).end("Document not found");
      }

      return res.status(200).json({
        message: "Document moved successfully",
        newPath: document.folder?.path,
        oldPath: currentPathName,
      });
    } catch (error) {
      errorhandler(error, res);
    }
  } else if (req.method === "DELETE") {
    // DELETE /api/teams/:teamId/documents/:id
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, id: docId } = req.query as { teamId: string; id: string };
    const userId = (session.user as CustomUser).id;

    try {
      const document = await prisma.document.findUnique({
        where: {
          id: docId,
          teamId: teamId,
          team: {
            users: {
              some: {
                userId: userId,
              },
            },
          },
        },
        include: {
          versions: {
            select: {
              id: true,
              file: true,
              type: true,
              storageType: true,
            },
          },
        },
      });

      if (!document) {
        return res.status(404).end("Document not found");
      }

      if (document.type !== "notion") {
        for (const version of document.versions) {
          await deleteFile({ type: version.storageType, data: version.file });
        }
      }

      await prisma.document.delete({
        where: {
          id: docId,
        },
      });

      return res.status(204).end(); // 204 No Content for successful delete
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
