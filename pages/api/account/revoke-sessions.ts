import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // POST /api/account/revoke-sessions
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }
    const sessionUser = session.user as CustomUser;

    try {
      // Increment sessionVersion to invalidate all existing sessions
      await prisma.user.update({
        where: {
          id: sessionUser.id,
        },
        data: {
          sessionVersion: {
            increment: 1,
          },
        },
      });

      // Also delete any database sessions (if using database strategy as fallback)
      await prisma.session.deleteMany({
        where: {
          userId: sessionUser.id,
        },
      });

      return res.status(200).json({
        message:
          "All sessions have been revoked. You will be logged out shortly.",
      });
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
