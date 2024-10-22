import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { nanoid } from 'nanoid';

// Customize nanoid to generate a unique code of length 15
const generateUniqueInviteCode = (): string => {
  return nanoid(15); // Generate a unique code of length 15
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teamId } = req.query as { teamId: string };

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  switch (req.method) {
    case "POST":
      // Generate a new invite code
      const newInviteCode = generateUniqueInviteCode();
      await prisma.team.update({
        where: { id: teamId },
        data: { inviteCode: newInviteCode }, // Store the unique code in inviteCode
      });
      return res.json({ inviteLink: `https://papermark.com/teams/invite/${newInviteCode}` }); // Return the full invite link

    case "GET":
      // Get the current invite code
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { inviteCode: true }, // Change to inviteCode
      });
      
      if (!team?.inviteCode) {
        // If no invite code exists, create one
        const newCode = generateUniqueInviteCode();
        await prisma.team.update({
          where: { id: teamId },
          data: { inviteCode: newCode }, // Store the unique code in inviteCode
        });
        return res.json({ inviteLink: `https://papermark.com/teams/invite/${newCode}` }); // Return the full invite link
      }
      
      // Here, team.inviteCode should only contain the unique code
      return res.json({ inviteLink: `https://papermark.com/teams/invite/${team.inviteCode}` }); // Return the full invite link

    default:
      res.setHeader("Allow", ["POST", "GET"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}