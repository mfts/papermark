import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../../../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";
import { identifyUser, trackAnalytics } from "@/lib/analytics";
import { errorhandler } from "@/lib/errorHandler";
import { getTeamWithLogo } from "@/lib/team/helper";
import { z } from "zod";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/logo
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId } = req.query as { teamId: string };

    const userId = (session.user as CustomUser).id;

    try {
      const { team } = await getTeamWithLogo({
        teamId,
        userId,
        options: {
          select: {
            name: true,
            id: true,
            file: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      });

      const logos = team.logos;
      return res.status(200).json(logos);
    } catch (error) {
      errorhandler(error, res);
    }
  } else if (req.method === "POST") {
    // POST /api/teams/:teamId/logo
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const { teamId } = req.query as { teamId: string };

    const userId = (session.user as CustomUser).id;

    try {
      await getTeamWithLogo({
        teamId,
        userId,
      });

      const schema = z.object({
        file: z.string().url(),
        type: z.string(),
        name: z.string(),
      });

      const validate = schema.safeParse(req.body);

      if (!validate.success) {
        const { errors } = validate.error;

        return res.status(400).json({
          error: { message: "Invalid request", errors },
        });
      }

      const { name, file, type } = validate.data;

      const response = await prisma.logo.create({
        data: {
          teamId,
          userId,
          name,
          file,
          type,
        },
      });

      await identifyUser(userId);
      await trackAnalytics({
        event: "Logo Added",
        name: name,
      });

      return res.status(201).json(response);
    } catch (error) {
      log(`Failed to add logo. Error: \n\n ${error}`);
      errorhandler(error, res);
    }
  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
