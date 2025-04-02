import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // PUT /api/teams/:teamId/datarooms/:id/archive
  if (req.method !== "PUT") {
    res.setHeader("Allow", ["PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { teamId, id: dataroomId } = req.query as {
    teamId: string;
    id: string;
  };
  const { isArchived } = req.body;

  const userId = (session.user as CustomUser).id;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.dataroom.update({
        where: { id: dataroomId, teamId },
        data: {
          isArchived: isArchived,
          archivedAt: new Date(),
          archivedBy: userId,
        },
      });

      await tx.link.updateMany({
        where: { dataroomId, teamId },
        data: {
          isArchived: isArchived,
        },
      });
    });

    return res.status(200).json({
      message: isArchived
        ? "Dataroom archived successfully"
        : "Dataroom unarchived successfully",
    });
  } catch (error) {
    return errorhandler(error, res);
  }
}
