import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { getViewUserAgent } from "@/lib/tinybird";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/datarooms/:id/views/:viewId/user-agent
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const {
      teamId,
      id: dataroomId,
      viewId,
    } = req.query as {
      teamId: string;
      id: string;
      viewId: string;
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
        select: {
          id: true,
          plan: true,
        },
      });

      if (!team) {
        return res.status(401).end("Unauthorized");
      }

      if (team.plan.includes("free")) {
        return res.status(403).end("Forbidden");
      }
      const userAgent = await getViewUserAgent({
        viewId: viewId,
      });

      const userAgentData = userAgent.data[0];

      if (!userAgentData) {
        return res.status(404).end("No user agent data found");
      }

      // Include country and city for business and datarooms plans
      if (team.plan.includes("business") || team.plan.includes("datarooms")) {
        return res.status(200).json(userAgentData);
      } else {
        // For other plans, exclude country and city
        const { country, city, ...remainingResponse } = userAgentData;
        return res.status(200).json(remainingResponse);
      }
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow GET requests
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
