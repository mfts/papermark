import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../../../../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { del } from "@vercel/blob";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";
import { errorhandler } from "@/lib/errorHandler";

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
      const { document } = await getTeamWithUsersAndDocument({
        teamId,
        userId,
        docId,
        options: {
          include: {
            // Get the latest primary version of the document
            versions: {
              where: { isPrimary: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      });

      // Check that the user is owner of the document, otherwise return 401
      // if (document.ownerId !== (session.user as CustomUser).id) {
      //   return res.status(401).end("Unauthorized to access this document");
      // }

      return res.status(200).json(document);
    } catch (error) {
      errorhandler(error, res);
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
      const { document } = await getTeamWithUsersAndDocument({
        teamId,
        userId,
        docId,
        checkOwner: true,
        options: {
          select: {
            id: true,
            ownerId: true,
            file: true,
          },
        },
      });

      // delete the document from vercel blob
      await del(document!.file);
      // delete the document from database
      await prisma.document.delete({
        where: {
          id: docId,
        },
      });

      return res.status(204).end(); // 204 No Content response for successful deletes
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow GET and DELETE requests
    res.setHeader("Allow", ["GET", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
