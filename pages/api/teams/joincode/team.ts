import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    const { joinCode } = req.query as { joinCode: string };

    if (!joinCode) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    try {
      const team = await prisma.team.findFirst({
        where: {
          joinCode: joinCode,
        },
        select: {
          id: true,
          name: true,
          joinCode: true,
        },
      });

      if (!team || team.joinCode === null) {
        return res.status(404).json({ error: "Team not found" });
      }

      return res.json({ teamId: team.id, teamName: team.name });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to retrieve team" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

