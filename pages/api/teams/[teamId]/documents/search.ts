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
  if (req.method === "GET") {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, query } = req.query as { teamId: string; query?: string };
    const userId = (session.user as CustomUser).id;

    try {
      const documents = await prisma.document.findMany({
        where: {
          teamId: teamId,
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          folder: {
            select: {
              id: true,
              name: true,
              path: true,
            },
          },
          _count: {
            select: { links: true, views: true, versions: true },
          },
          links: {
            take: 1,
            select: { id: true },
          },
        },
      });

      return res.status(200).json(documents);
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
