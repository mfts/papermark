import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";
import { errorhandler } from "@/lib/errorHandler";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    // GET /api/teams/:teamId/documents/:id/update-name
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, id: docId } = req.query as { teamId: string; id: string };

    const userId = (session.user as CustomUser).id;

    try {
      await getTeamWithUsersAndDocument({
        teamId,
        userId,
        docId,
        checkOwner: true,
        options: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      });

      await prisma.document.update({
        where: {
          id: docId,
        },
        data: {
          name: req.body.name,
        },
      });

      return res.status(200).json({ message: "Document name updated!" });
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
