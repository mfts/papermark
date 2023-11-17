import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import prisma from "@/lib/prisma";
import { errorhandler } from "@/lib/errorHandler";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // POST /api/teams/:teamId/billing/manage – manage a user's subscription
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const { teamId } = req.query as { teamId: string };

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
        },
        select: {
          id: true,
          subscriptionId: true,
          startsAt: true,
          endsAt: true,
          plan: true,
          _count: {
            select: {
              documents: true,
            },
          },
        },
      });
      if (!team) {
        return res.status(400).json({ error: "Team does not exists" });
      }
      return res.status(200).json(team);
    } catch (error) {
      errorhandler(error, res);
    }

    // console.log("user", user);
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
