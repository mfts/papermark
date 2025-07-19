import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const { teamId, id } = req.query as {
    teamId: string;
    id: string;
  };
  const userId = (session.user as CustomUser).id;

  if (req.method === "GET") {
    try {
      // Verify user has access to the document
      const document = await prisma.document.findFirst({
        where: {
          id: id,
          teamId: teamId,
          team: {
            users: {
              some: {
                userId: userId,
              },
            },
          },
        },
        select: {
          id: true,
          _count: {
            select: {
              views: true,
            },
          },
        },
      });

      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      return res.status(200).json({ count: document._count.views });
    } catch (error) {
      console.error("Error fetching view count:", error);
      return res.status(500).json({ error: "Failed to fetch view count" });
    }
  }

  res.setHeader("Allow", ["GET"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
