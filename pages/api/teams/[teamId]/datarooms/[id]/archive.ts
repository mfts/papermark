import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/datarooms/:id/archive
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const { teamId, id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };
    const userId = (session.user as CustomUser).id;

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId: userId,
            },
          },
        },
      });

      if (!team) {
        return res.status(401).end("Unauthorized");
      }

      const dataroom = await prisma.dataroom.findUnique({
        where: {
          id: dataroomId,
          teamId: teamId,
        },
        select: { isArchived: true },
      });

      if (!dataroom) {
        return res.status(404).json({ message: "Dataroom not found" });
      }

      res.status(200).json({ isArchived: dataroom.isArchived });
    } catch (error) {
      console.error("Request error", error);
      res.status(500).json({ message: "Error fetching dataroom archive status" });
    }
  } else if (req.method === "POST") {
    // POST /api/teams/:teamId/datarooms/:id/archive
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const { teamId, id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };
    const userId = (session.user as CustomUser).id;

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId: userId,
            },
          },
        },
      });

      if (!team) {
        return res.status(401).end("Unauthorized");
      }

      const dataroom = await prisma.dataroom.findUnique({
        where: {
          id: dataroomId,
          teamId: teamId,
        },
        select: { id: true, isArchived: true },
      });

      if (!dataroom) {
        return res.status(404).json({ message: "Dataroom not found" });
      }

      // Toggle the archive status
      const updatedDataroom = await prisma.dataroom.update({
        where: { id: dataroomId },
        data: {
          isArchived: !dataroom.isArchived,
        },
      });

      res.status(200).json({ isArchived: updatedDataroom.isArchived });
    } catch (error) {
      console.error("Request error", error);
      res.status(500).json({ message: "Error updating dataroom archive status" });
    }
  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
