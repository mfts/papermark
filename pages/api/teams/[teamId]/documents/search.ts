import { NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

async function handleSearch(req: AuthenticatedRequest, res: NextApiResponse) {
  const { teamId, query } = req.query as { teamId: string; query?: string };

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
        _count: {
          select: { links: true, views: true, versions: true },
        },
      },
    });

    return res.status(200).json(documents);
  } catch (error) {
    errorhandler(error, res);
  }
}

export default createTeamHandler({
  GET: handleSearch,
});
