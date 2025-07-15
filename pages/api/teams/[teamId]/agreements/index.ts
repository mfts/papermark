import { NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId } = req.query as { teamId: string };

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId: req.user.id,
            },
          },
        },
        select: {
          agreements: {
            include: {
              _count: {
                select: {
                  links: true,
                },
              },
            },
          },
        },
      });

      if (!team) {
        res.status(401).json("Unauthorized");
        return;
      }

      const agreements = team.agreements;
      res.status(200).json(agreements);
    } catch (error) {
      errorhandler(error, res);
    }
  },

  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId } = req.query as { teamId: string };

    if (!teamId) {
      res.status(401).json("Unauthorized");
      return;
    }

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId: req.user.id,
            },
          },
        },
      });

      if (!team) {
        res.status(401).json("Unauthorized");
        return;
      }

      const { name, link, requireName } = req.body as {
        name: string;
        link: string;
        requireName: boolean;
      };

      const agreement = await prisma.agreement.create({
        data: {
          teamId,
          name,
          content: link,
          requireName,
        },
      });

      res.status(201).json(agreement);
    } catch (error) {
      log({
        message: `Failed to add agreement. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, userId: ${req.user.id}}\``,
        type: "error",
        mention: true,
      });
      errorhandler(error, res);
    }
  },
});
