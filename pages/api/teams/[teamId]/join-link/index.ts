import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { nanoid } from "nanoid";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { generateCode } from "@/lib/utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { teamId } = req.query as { teamId: string };

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  if (req.method === "POST") {
    // Generate a new join code
    const newJoinCode = generateCode();
    await prisma.team.update({
      where: { id: teamId },
      data: { joinCode: newJoinCode }, // Store the unique code in joinCode
    });
    return res.json({
      joinLink: `${process.env.NEXTAUTH_URL}/teams/join/${newJoinCode}`,
    }); // Return the full join link
  } else if (req.method === "GET") {
    // Get the current join code
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { joinCode: true }, // Change to joinCode
    });

    if (!team?.joinCode) {
      // If no join code exists, create one
      const newCode = generateCode();
      await prisma.team.update({
        where: { id: teamId },
        data: { joinCode: newCode }, // Store the unique code in joinCode
      });
      return res.json({
        joinLink: `${process.env.NEXTAUTH_URL}/teams/join/${newCode}`,
      }); // Return the full join link
    }

    // Here, team.joinCode should only contain the unique code
    return res.json({
      joinLink: `${process.env.NEXTAUTH_URL}/teams/join/${team.joinCode}`,
    }); // Return the full join link
  } else {
    res.setHeader("Allow", ["POST", "GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
