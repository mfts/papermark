import { NextApiRequest, NextApiResponse } from "next";

import prisma from "@/lib/prisma";
import { generateCode } from "@/lib/utils";

const getJoinCode = async (req: NextApiRequest, res: NextApiResponse) => {
  const { dataroomId, groupId } = req.query;

  if (!dataroomId || !groupId) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const joinCode = await prisma.team.findUnique({
      where: {
        id: groupId as string,
      },
      select: {
        joinCode: true,
      },
    });

    if (!joinCode) {
      const newJoinCode = generateCode();
      await prisma.team.update({
        where: {
          id: groupId as string,
        },
        data: {
          joinCode: newJoinCode,
        },
      });
      return res.json({ joinCode: newJoinCode });
    }

    return res.json({ joinCode: joinCode.joinCode });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to retrieve join code" });
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    return getJoinCode(req, res);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
