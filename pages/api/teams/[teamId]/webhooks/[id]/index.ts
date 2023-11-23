import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import prisma from "@/lib/prisma";
import { errorhandler } from "@/lib/errorHandler";
import { getTeamWithUser } from "@/lib/team/helper";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "DELETE") {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const userId = (session.user as CustomUser).id;

    const { id } = req.query as { id: string };

    const { teamId } = req.query as { teamId: string };

    try {
      await getTeamWithUser({ teamId, userId });

      const webhook = await prisma.webhook.findUnique({
        where: {
          id,
        },
      });

      if (webhook?.teamId !== teamId) {
        return res.status(401).json("Webhook doesn't belong to this team");
      }

      await prisma.webhook.delete({
        where: {
          id,
        },
      });

      return res.status(204).end();
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
