import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/pages/api//auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { getTeamWithLogo } from "@/lib/team/helper";
import { errorhandler } from "@/lib/errorHandler";
import { del } from "@vercel/blob";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "DELETE") {
    // DELETE /api/teams/:teamId/logo/:id
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const { teamId, logoId } = req.query as {
      teamId: string;
      logoId: string;
    };

    const userId = (session.user as CustomUser).id;

    try {
      const { logo } = await getTeamWithLogo({
        teamId,
        userId,
        logoId,
        options: {
          select: {
            id: true,
            name: true,
            file: true,
          },
        },
      });

      if (!logo) {
        res.status(400).json({
          error: { message: `logo with id ${logoId} was not found` },
        });
      }
      // delete the document from vercel blob
      await del(logo!.file);
      // delete the document from database
      await prisma.logo.delete({
        where: {
          id: logo!.id,
        },
      });

      return res.status(204).end(); // 204 No Content response for successful deletes
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
