import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";

import prisma from "@/lib/prisma";
import { generateCode } from "@/lib/utils";

const getJoinCode = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { teamId } = req.query as { teamId: string };

  if (!teamId) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const team = await prisma.team.findUnique({
      where: {
        id: teamId as string,
      },
      select: {
        joinCode: true,
      },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    if (!team.joinCode) {
      const newJoinCode = generateCode();
      await prisma.team.update({
        where: {
          id: teamId as string,
        },
        data: {
          joinCode: newJoinCode,
        },
      });
      return res.json({ joinCode: newJoinCode });
    }

    console.log("joinCode :", team.joinCode);
    return res.json({ joinCode: team.joinCode });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to retrieve join code" });
  }
};

const generateNewJoinCode = async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { teamId } = req.query as { teamId: string };

  if (!teamId) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const newJoinCode = generateCode();
    await prisma.team.update({
      where: {
        id: teamId,
      },
      data: {
        joinCode: newJoinCode,
      },
    });
    return res.json({ joinCode: newJoinCode });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to generate new join code" });
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    return getJoinCode(req, res);
  } else if (req.method === "POST") {
    return generateNewJoinCode(req, res);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
