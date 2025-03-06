import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";

import { hashToken } from "@/lib/api/auth/token";
import { getFeatureFlags } from "@/lib/featureFlags";
import { newId } from "@/lib/id-helper";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { teamId } = req.query as { teamId: string };

  const features = await getFeatureFlags({ teamId });
  if (!features.tokens) {
    return res
      .status(403)
      .json({ error: "This feature is not available for your team" });
  }

  if (req.method === "GET") {
    try {
      const session = await getServerSession(req, res, authOptions);
      if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { teamId } = req.query as { teamId: string };
      const userId = (session.user as CustomUser).id;

      // Check if user is in team
      const userTeam = await prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
      });

      if (!userTeam) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Fetch tokens
      const tokens = await prisma.restrictedToken.findMany({
        where: {
          teamId,
        },
        select: {
          id: true,
          name: true,
          partialKey: true,
          createdAt: true,
          lastUsed: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.status(200).json(tokens);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error fetching tokens" });
    }
  } else if (req.method === "POST") {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { teamId } = req.query as { teamId: string };
    const userId = (session.user as CustomUser).id;
    const { name } = req.body;

    try {
      // Check if user is in team
      const { role } = await prisma.userTeam.findUniqueOrThrow({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
        select: {
          role: true,
        },
      });

      // Only admins and managers can create tokens
      if (role !== "ADMIN" && role !== "MANAGER") {
        return res.status(403).json({
          error:
            "You don't have the permissions to create a token. Please contact your administrator or manager.",
        });
      }

      // Generate token
      const token = newId("token"); // pmk_
      const hashedToken = hashToken(token);
      const partialKey = `${token.slice(0, 3)}...${token.slice(-4)}`;

      // Create token in database
      await prisma.restrictedToken.create({
        data: {
          name,
          hashedKey: hashedToken,
          partialKey,
          teamId,
          userId,
        },
      });

      // Return token only once
      return res.status(200).json({ token });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error creating token" });
    }
  } else if (req.method === "DELETE") {
    try {
      const session = await getServerSession(req, res, authOptions);
      if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { teamId } = req.query as { teamId: string };
      const { tokenId } = req.body;
      const userId = (session.user as CustomUser).id;

      // Check if user is in team and has admin role
      const { role } = await prisma.userTeam.findUniqueOrThrow({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
        select: {
          role: true,
        },
      });

      // Only admins can delete tokens
      if (role !== "ADMIN") {
        return res.status(403).json({
          error:
            "You don't have the permissions to delete a token. Please contact your administrator.",
        });
      }

      // Delete the token
      await prisma.restrictedToken.delete({
        where: {
          id: tokenId,
          teamId, // Ensure token belongs to the team
        },
      });

      return res.status(200).json({ message: "Token deleted successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error deleting token" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return res.status(405).json({ error: "Method not allowed" });
  }
}
