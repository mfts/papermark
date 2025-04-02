import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // POST /api/teams/:teamId/documents/:id/approve
  if (req.method === "POST") {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, id: documentId } = req.query as {
      teamId: string;
      id: string;
    };
    if (!documentId) {
      return res.status(400).json({ message: "Document ID is required!" });
    }
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
        },
      });

      if (!team) {
        return res.status(404).json({ message: "Team not found!" });
      }

      const isUserPartOfTeam = team.users.some((user) => user.userId === userId);
      if (!isUserPartOfTeam) {
        return res.status(403).json({ message: "You are not a member of this team" });
      }

      const updatedDocument = await prisma.document.update({
        where: { id: documentId, teamId: teamId },
        data: {
          approvalStatus: "APPROVED",
          approvedBy: userId,
          approvedAt: new Date(),
        },
      });

      if (!updatedDocument) {
        return res.status(404).json({ message: "Document not found!" });
      }
      return res.status(200).json({ message: "Document approved!" });
    } catch (error) {
      console.error("Error approving document:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
