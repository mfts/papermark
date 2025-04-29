import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";
import { version } from "os";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // GET /api/teams/:teamId/documents/:id/update-name
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, id: docId } = req.query as { teamId: string; id: string };
    const { versionId, isVertical } = req.body as {
      versionId: string;
      isVertical: boolean;
    };

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
          documents: {
            some: {
              id: {
                equals: docId,
              },
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

      await prisma.documentVersion.update({
        where: {
          id: versionId,
        },
        data: {
          isVertical,
        },
      });

      await fetch(
        `${process.env.NEXTAUTH_URL}/api/revalidate?secret=${process.env.REVALIDATE_TOKEN}&documentId=${docId}`,
      );

      return res.status(200).json({
        message: `Document orientation changed to ${isVertical ? "portrait" : "landscape"}!`,
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
