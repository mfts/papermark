import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import prisma from "@/lib/prisma";
import { isOrganizationEmail, getEmailDomain } from "@/lib/utils/email-domain";
import { errorhandler } from "@/lib/errorHandler";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getSession({ req });
    if (!session?.user?.email) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userEmail = session.user.email;
    const isOrgEmail = await isOrganizationEmail(userEmail);
    // Only proceed if user has an organization email
    if (isOrgEmail) {
      return res.status(200).json({ members: [] });
    }

    const userDomain = getEmailDomain(userEmail);

    const teamId = req.query.teamId as string;
    if (!teamId) {
      return res.status(400).json({ error: "Team ID is required" });
    }

    const teamUsers = await prisma.userTeam.findMany({
      where: {
        teamId: teamId
      },
      select: {
        userId: true
      }
    });

    // Extract just the user IDs from team members
    const teamUserIds = teamUsers.map((user) => user.userId);

    // Find other users with the same email domain who are not in the team
    const orgMembers = await prisma.user.findMany({
      where: {
        email: {
          endsWith: `@${userDomain}`,
          not: userEmail
        },
        id: {
          notIn: teamUserIds
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    });

    return res.status(200).json({ members: orgMembers });
  } catch (error) {
    return errorhandler(error, res);
  }
}