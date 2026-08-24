import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const { teamId, id } = req.query as { teamId: string; id: string };

  try {
    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
      select: {
        id: true,
        users: { select: { userId: true } },
      },
    });

    // check that the user is member of the team, otherwise return 403
    const teamUsers = team?.users;
    const isUserPartOfTeam = teamUsers?.some(
      (user) => user.userId === (session.user as CustomUser).id,
    );
    if (!isUserPartOfTeam) {
      return res.status(403).end("Unauthorized to access this team");
    }
  } catch (error) {
    errorhandler(error, res);
  }

  if (req.method === "DELETE") {
    // DELETE /api/teams/:teamId/watermark-presets/[id]
    const preset = await prisma.watermarkPreset.findUnique({
      where: { id, teamId },
    });

    if (!preset) {
      return res.status(404).json({ error: "Watermark preset not found" });
    }

    await prisma.watermarkPreset.delete({
      where: { id, teamId },
    });

    return res.status(204).end();
  } else {
    // We only allow DELETE requests
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
