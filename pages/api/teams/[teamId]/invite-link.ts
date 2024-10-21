import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { v4 as uuidv4 } from 'uuid';

const generateUniqueInviteLink = (): string => {
  return `https://papermark.com/teams/invite/${uuidv4()}`;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teamId } = req.query as { teamId: string };

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  switch (req.method) {
    case "POST":
      // Generate a new invite link
      const newInviteLink = generateUniqueInviteLink();
      const updatedTeam = await prisma.team.update({
        where: { id: teamId },
        data: { inviteLink: newInviteLink },
        select: { inviteLink: true },
      });
      return res.json({ inviteLink: updatedTeam.inviteLink });

    case "GET":
      // Get the current invite link
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { inviteLink: true },
      });
      
      if (!team?.inviteLink) {
        // If no invite link exists, create one
        const newLink = generateUniqueInviteLink();
        const updatedTeam = await prisma.team.update({
          where: { id: teamId },
          data: { inviteLink: newLink },
          select: { inviteLink: true },
        });
        return res.json({ inviteLink: updatedTeam.inviteLink });
      }
      
      return res.json({ inviteLink: team.inviteLink });

    default:
      res.setHeader("Allow", ["POST", "GET"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
