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
  if (req.method === "PUT") {
    // PUT /api/teams/:teamId/views/:id/archive
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const userId = (session.user as CustomUser).id;
    const { teamId, id } = req.query as { teamId: string; id: string };
    const { isArchived } = req.body;

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: { some: { userId } },
        },
      });

      if (!team) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Update the link in the database
      const updatedView = await prisma.view.update({
        where: { id, teamId },
        data: {
          isArchived: isArchived,
        },
      });

      if (!updatedView) {
        return res.status(404).json({ error: "View not found" });
      }

      return res.status(200).json(updatedView);
    } catch (error) {
      errorhandler(error, res);
    }
  }

  // We only allow PUT requests
  res.setHeader("Allow", ["PUT"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
