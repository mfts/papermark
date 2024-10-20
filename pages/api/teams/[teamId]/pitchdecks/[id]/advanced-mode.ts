import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { DocumentStorageType } from "@prisma/client";
import { waitUntil } from "@vercel/functions";
import { getServerSession } from "next-auth/next";
import { version } from "os";

import { errorhandler } from "@/lib/errorHandler";
import { copyFileToBucketServer } from "@/lib/files/copy-file-to-bucket-server";
import prisma from "@/lib/prisma";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // GET /api/teams/:teamId/pitchdecks/:id/advanced-mode
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
          users: {
            some: {
              userId,
            },
          },
        },
        select: {
          id: true,
        },
      });

      if (!team) {
        return res.status(401).end("Unauthorized");
      }

      const documentVersion = await prisma.documentVersion.findFirst({
        where: {
          documentId: docId,
          isPrimary: true,
          type: "sheet",
        },
      });

      if (!documentVersion) {
        return res.status(404).end("Document not found");
      }

      await copyFileToBucketServer({
        filePath: documentVersion.file,
        storageType: documentVersion.storageType,
      });

      const documentPromise = prisma.document.update({
        where: { id: docId },
        data: { advancedExcelEnabled: true },
      });

      const documentVersionPromise = prisma.documentVersion.update({
        where: { id: documentVersion.id },
        data: { numPages: 1 },
      });

      await Promise.all([documentPromise, documentVersionPromise]);

      await fetch(
        `${process.env.NEXTAUTH_URL}/api/revalidate?secret=${process.env.REVALIDATE_TOKEN}&documentId=${docId}`,
      );

      return res.status(200).json({
        message: `Document updated to advanced Excel mode!`,
      });
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
