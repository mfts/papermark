import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import prisma from "@/lib/prisma";
import { errorhandler } from "@/lib/errorHandler";
import { getTeamWithUser } from "@/lib/team/helper";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const userId = (session.user as CustomUser).id;

    const { teamId } = req.query as { teamId: string };

    try {
      await getTeamWithUser({ teamId, userId });

      const notifications = await prisma.notification.findMany({
        where: {
          teamId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.status(200).json(notifications);
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
