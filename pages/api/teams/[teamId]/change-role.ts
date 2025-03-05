import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "PUT") {
    // DELETE /api/teams/:teamId/change-role
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId } = req.query as { teamId: string };
    const userId = (session.user as CustomUser).id;

    const { userToBeChanged, role, selectedDatarooms } = req.body as {
      userToBeChanged: string;
      role: "MEMBER" | "MANAGER" | "DATAROOM_MEMBER";
      selectedDatarooms: string[];
    };

    try {
      const userTeam = await prisma.userTeam.findFirst({
        where: {
          teamId,
          userId,
        },
      });

      if (!userTeam) {
        return res.status(401).json("Unauthorized");
      }

      if (userTeam?.role === "ADMIN" && userTeam.userId === userToBeChanged) {
        return res.status(401).json("You can't change the Admin");
      }

      await prisma.$transaction(async (tx) => {
        const userTeam = await tx.userTeam.upsert({
          where: {
            userId_teamId: {
              userId: userToBeChanged,
              teamId,
            },
          },
          update: {
            role,
          },
          create: {
            userId: userToBeChanged,
            teamId,
            role,
          },
        });

        // Step 2: If role is DATAROOM_MEMBER, update UserDataroom entries
        if (role === "DATAROOM_MEMBER") {
          if (!selectedDatarooms || selectedDatarooms.length === 0) {
            throw new Error(
              "At least one dataroom must be selected for DATAROOM_MEMBER.",
            );
          }

          // Remove existing UserDatarooms first
          await tx.userDataroom.deleteMany({
            where: { userId: userToBeChanged, teamId },
          });

          // Assign new datarooms
          await tx.userDataroom.createMany({
            data: selectedDatarooms.map((dataroomId) => ({
              userId: userToBeChanged,
              teamId,
              dataroomId,
            })),
          });
        } else {
          // If role is changed from DATAROOM_MEMBER to something else, remove existing UserDatarooms
          await tx.userDataroom.deleteMany({
            where: { userId: userToBeChanged, teamId },
          });
        }
      });

      return res.status(204).end();
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
