import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../../../../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { del } from "@vercel/blob";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/documents/:id
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, id: docId } = req.query as { teamId: string; id: string };

    const userId = (session.user as CustomUser).id;

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
        },
        include: {
          users: {
            select: {
              userId: true,
            },
          },
          documents: {
            include: {
              // Get the latest primary version of the document
              versions: {
                where: { isPrimary: true },
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
      });

      // check if the team exists
      if (!team) {
        res.status(400).end("Team doesn't exists");
      }

      // check if the user is part the team
      const teamHasUser = team?.users.some((user) => user.userId === userId);
      if (!teamHasUser) {
        res.status(401).end("You are not a member of the team");
      }

      // check if the document exists in the team
      const document = team?.documents.find((doc) => doc.id === docId);
      if (!document) {
        return res.status(400).end("Document doesn't exists in the team");
      }

      // Check that the user is owner of the document, otherwise return 401
      // if (document.ownerId !== (session.user as CustomUser).id) {
      //   return res.status(401).end("Unauthorized to access this document");
      // }

      return res.status(200).json(document);
    } catch (error) {
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else if (req.method === "DELETE") {
    // DELETE /api/teams/:teamId/document/:id
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const { teamId, id: docId } = req.query as { teamId: string; id: string };

    const userId = (session.user as CustomUser).id;

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
        },
        include: {
          users: {
            select: {
              userId: true,
            },
          },
          documents: {
            select: {
              id: true,
              ownerId: true,
              file: true,
            },
          },
        },
      });

      // check if the team exists
      if (!team) {
        res.status(400).end("Team doesn't exists");
      }

      // check if the user is part the team
      const teamHasUser = team?.users.some((user) => user.userId === userId);
      if (!teamHasUser) {
        res.status(401).end("You are not a member of the team");
      }

      // check if the document exists in the team
      const document = team?.documents.find((doc) => doc.id === docId);
      if (!document) {
        return res.status(400).end("Document doesn't exists in the team");
      }

      // check that the user is owner of the document, otherwise return 401
      if (document.ownerId !== userId) {
        return res.status(401).end("Unauthorized to access the document");
      }

      // delete the document from vercel blob
      await del(document.file);
      // delete the document from database
      await prisma.document.delete({
        where: {
          id: docId,
        },
      });

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
