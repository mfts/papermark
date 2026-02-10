import { NextApiRequest, NextApiResponse } from "next";

import prisma from "@/lib/prisma";

// Check if SAML is configured for a given email domain
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { email } = req.query as { email: string };

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const domain = email.split("@")[1];
    if (!domain) {
      return res.status(400).json({ error: "Invalid email" });
    }

    // Find a team that has SAML enabled and is associated with this email domain
    // We look for teams where the user's email domain matches
    const teamsWithSaml = await prisma.team.findMany({
      where: {
        samlEnabled: true,
      },
      select: {
        id: true,
        name: true,
        samlProvider: true,
      },
    });

    // Check if any team has a user with this domain
    for (const team of teamsWithSaml) {
      const membership = await prisma.userTeam.findFirst({
        where: {
          teamId: team.id,
          user: {
            email: {
              endsWith: `@${domain}`,
            },
          },
        },
      });

      if (membership) {
        return res.status(200).json({
          hasSaml: true,
          teamId: team.id,
          teamName: team.name,
          provider: team.samlProvider,
        });
      }
    }

    return res.status(200).json({ hasSaml: false });
  } catch (error: any) {
    console.error("[SAML] Check error:", error);
    return res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
}
