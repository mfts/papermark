import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { vectorManager } from "@/lib/rag/vector-manager";
import { CustomUser } from "@/lib/types";
import { getFeatureFlags } from "@/lib/featureFlags";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "PATCH") {
    // PATCH /api/teams/:teamId/datarooms/:id/documents/:documentId
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }
    const userId = (session.user as CustomUser).id;
    const {
      teamId,
      id: dataroomId,
      documentId,
    } = req.query as { teamId: string; id: string; documentId: string };
    const { folderId, currentPathName } = req.body as {
      folderId: string;
      currentPathName: string;
    };

    try {
      // Check if the user is part of the team
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

      const document = await prisma.dataroomDocument.update({
        where: {
          id: documentId,
          dataroomId: dataroomId,
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
    } catch (error) {}
  } else if (req.method === "DELETE") {
    /// DELETE /api/teams/:teamId/datarooms/:id/documents/:documentId
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const userId = (session.user as CustomUser).id;
    const {
      teamId,
      id: dataroomId,
      documentId,
    } = req.query as { teamId: string; id: string; documentId: string };

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

      const dataroom = await prisma.dataroom.findUnique({
        where: {
          id: dataroomId,
          teamId: team.id,
        },
      });

      if (!dataroom) {
        return res.status(401).end("Dataroom not found");
      }

      const dataroomDocument = await prisma.dataroomDocument.findUnique({
        where: {
          id: documentId,
          dataroomId: dataroomId,
        },
        include: {
          document: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!dataroomDocument) {
        return res.status(404).end("Document not found");
      }

      const featureFlags = await getFeatureFlags({ teamId: team.id });
      if (featureFlags.ragIndexing) {
        await vectorManager.deleteDocumentVectors(
          dataroomId,
          dataroomDocument.documentId,
          dataroomDocument.document.name
        );
      }

      await prisma.dataroomDocument.delete({
        where: {
          id: documentId,
          dataroomId: dataroomId,
        },
      });

      return res.status(204).end(); // No Content
    } catch (error) {}
  } else {
    // We only allow PATCH and DELETE requests
    res.setHeader("Allow", ["PATCH", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
