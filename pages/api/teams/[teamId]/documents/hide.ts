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
  if (req.method === "POST") {
    // POST /api/teams/:teamId/documents/hide
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId } = req.query as { teamId: string };
    const userId = (session.user as CustomUser).id;

    const { documentIds, hidden } = req.body as {
      documentIds: string[];
      hidden: boolean;
    };

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({ error: "Document IDs are required" });
    }

    if (typeof hidden !== "boolean") {
      return res.status(400).json({ error: "Hidden flag is required" });
    }

    try {
      // Check team access
      const teamAccess = await prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
      });

      if (!teamAccess) {
        return res.status(401).end("Unauthorized");
      }

      // Update the documents
      const result = await prisma.document.updateMany({
        where: {
          id: { in: documentIds },
          teamId,
        },
        data: {
          hiddenInAllDocuments: hidden,
        },
      });

      return res.status(200).json({
        message: `${result.count} document(s) ${hidden ? "hidden" : "unhidden"} successfully`,
        count: result.count,
      });
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
