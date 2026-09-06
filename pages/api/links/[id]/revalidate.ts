import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth/next";

import { revalidateLinkById } from "@/lib/api/links/revalidate";
import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const { id } = req.query as { id: string };
  const { teamId } = req.body as { teamId?: string };

  if (!teamId) {
    return res.status(400).json({ error: "teamId is required" });
  }

  const userId = (session.user as CustomUser).id;

  try {
    const teamAccess = await prisma.userTeam.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
      select: { status: true, blockedAt: true },
    });

    if (!teamAccess) {
      return res.status(403).end("Forbidden");
    }

    if (teamAccess.status !== "ACTIVE" || teamAccess.blockedAt) {
      return res
        .status(403)
        .json({ error: "Your access to this team is not active." });
    }
    const link = await prisma.link.findUnique({
      where: { id, teamId, deletedAt: null },
      select: { id: true },
    });

    if (!link) {
      return res.status(404).json({ error: "Link not found" });
    }

    const revalidated = await revalidateLinkById(id);
    if (!revalidated) {
      return res.status(500).json({ error: "Failed to revalidate link cache" });
    }

    return res.status(200).json({ revalidated: true });
  } catch (error) {
    return errorhandler(error, res);
  }
}
