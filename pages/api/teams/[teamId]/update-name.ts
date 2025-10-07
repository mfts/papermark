import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { validateContent } from "@/lib/utils/sanitize-html";

import { authOptions } from "../../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "PATCH") {
    // PATCH /api/teams/:teamId/update-name
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId } = req.query as { teamId: string };

    try {
      // check if the team exists
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
        },
        include: {
          users: true,
        },
      });
      if (!team) {
        return res.status(400).json("Team doesn't exists");
      }

      // check if current user is admin of the team
      const isUserAdmin = team.users.some(
        (user) =>
          user.role === "ADMIN" &&
          user.userId === (session.user as CustomUser).id,
      );
      if (!isUserAdmin) {
        return res
          .status(403)
          .json("You are not permitted to perform this action");
      }

      // Validate and sanitize the team name
      let sanitizedName: string;
      try {
        sanitizedName = validateContent(req.body.name);
      } catch (error) {
        return res.status(400).json({
          error: {
            message: (error as Error).message || "Invalid team name",
          },
        });
      }

      // Check if name exceeds the maximum length (32 characters as per frontend)
      if (sanitizedName.length > 32) {
        return res.status(400).json({
          error: {
            message: "Team name cannot exceed 32 characters",
          },
        });
      }

      // update name
      await prisma.team.update({
        where: {
          id: teamId,
        },
        data: {
          name: sanitizedName,
        },
      });

      return res.status(200).json("Team name updated!");
    } catch (error) {
      return res.status(500).json((error as Error).message);
    }
  } else {
    // We only allow PATCH requests
    res.setHeader("Allow", "[PATCH]");
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
