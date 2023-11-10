import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../../../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";
import { addDomainToVercel, validDomainRegex } from "@/lib/domains";
import { identifyUser, trackAnalytics } from "@/lib/analytics";
import { errorhandler } from "@/lib/errorHandler";
import { getTeamWithDomain } from "@/lib/team/helper";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/domains
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId } = req.query as { teamId: string };

    const userId = (session.user as CustomUser).id;

    try {
      const { team } = await getTeamWithDomain({
        teamId,
        userId,
        options: {
          select: {
            slug: true,
            verified: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      });

      const domains = team.domains;
      return res.status(200).json(domains);
    } catch (error) {
      errorhandler(error, res);
    }
  } else if (req.method === "POST") {
    // POST /api/teams/:teamId/domains
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const { teamId } = req.query as { teamId: string };

    const userId = (session.user as CustomUser).id;

    // You could perform some validation here

    try {
      await getTeamWithDomain({
        teamId,
        userId,
      });

      // Assuming data is an object with `domain` properties
      const { domain } = req.body;

      // TODO: Add check for if the domain already exists on another user
      const validDomain = validDomainRegex.test(domain);
      if (validDomain !== true) {
        return res.status(422).json("Invalid domain");
      }

      // console.log("Valid domain", domain);

      const response = await prisma.domain.create({
        data: {
          slug: domain,
          userId,
          teamId,
        },
      });
      await addDomainToVercel(domain);

      await identifyUser(userId);
      await trackAnalytics({
        event: "Domain Added",
        slug: domain,
      });

      return res.status(201).json(response);
    } catch (error) {
      log(`Failed to add domain. Error: \n\n ${error}`);
      errorhandler(error, res);
    }
  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
