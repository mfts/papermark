import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "PUT") {
    // PUT /api/teams/:teamId/agreements/:agreementId
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const userId = (session.user as CustomUser).id;
    const { teamId } = req.query as { teamId: string };
    const { agreementId } = req.query as { agreementId: string };

    if (!teamId || !agreementId) {
      return res.status(401).json("Unauthorized");
    }

    try {
      await prisma.agreement.update({
        where: {
          id: agreementId,
          teamId,
        },
        data: {
          deletedAt: new Date(),
          deletedBy: userId,
        },
      });

      return res.status(200).json({ message: "Agreement deleted" });
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
