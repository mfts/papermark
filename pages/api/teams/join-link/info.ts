import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";

import prisma from "@/lib/prisma";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/join-link/info
    const session = await getServerSession(req, res, authOptions);

    const { joinCode } = req.query as { joinCode: string };

    if (!session) {
      res.redirect(
        `/login?next=/api/teams/join-link/info?joinCode=${joinCode}`,
      );
      return;
    }

    try {
      const team = await prisma.team.findUnique({
        where: { joinCode },
        select: { name: true },
      });

      if (!team) {
        return res.status(404).json({ error: "Invalid join link" });
      }

      return res.json({ teamName: team.name });
    } catch (error) {
      console.error(error);
      return res.status(500).json("Internal Server Error");
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
