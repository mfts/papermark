import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { getTeamWithLogo } from "@/lib/team/helper";
import { errorhandler } from "@/lib/errorHandler";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // GET /api/teams/:teamId/logo/:logoId/update-name
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, logoId } = req.query as { teamId: string; logoId: string };

    const userId = (session.user as CustomUser).id;

    try {
      await getTeamWithLogo({
        teamId,
        userId,
        logoId,
        options: {
          select: {
            id: true,
          },
        },
      });

      await prisma.logo.update({
        where: {
          id: logoId,
        },
        data: {
          name: req.body.name,
        },
      });

      return res.status(200).json({ message: "Logo name updated!" });
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
