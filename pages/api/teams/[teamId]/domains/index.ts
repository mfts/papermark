import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth/next";

import { addDomainToVercel, validDomainRegex } from "@/lib/domains";
import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { getTeamWithDomain } from "@/lib/team/helper";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";

import { authOptions } from "../../../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
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
            isDefault: true,
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

    const userId = (session.user as CustomUser).id;
    const { teamId } = req.query as { teamId: string };

    if (!teamId) {
      return res.status(401).json("Unauthorized");
    }

    try {
      await getTeamWithDomain({
        teamId,
        userId,
      });

      // Assuming data is an object with `domain` properties
      const { domain } = req.body;

      // Sanitize domain by removing whitespace, protocol, and paths
      const sanitizedDomain = domain
        .trim()
        .toLowerCase()
        .replace(/^(?:https?:\/\/)?(?:www\.)?/i, "")
        .split("/")[0];

      // Check if domain is valid
      const validDomain = validDomainRegex.test(sanitizedDomain);
      if (validDomain !== true) {
        return res.status(422).json("Invalid domain");
      }

      // Check if domain contains papermark
      if (sanitizedDomain.toLowerCase().includes("papermark")) {
        return res
          .status(400)
          .json({ message: "Domain cannot contain 'papermark'" });
      }

      // Check if domain already exists
      const existingDomain = await prisma.domain.findFirst({
        where: {
          slug: sanitizedDomain,
        },
      });

      if (existingDomain) {
        return res
          .status(400)
          .json({ message: "Unable to add this domain. Please try a different one." });
      }

      const response = await prisma.domain.create({
        data: {
          slug: sanitizedDomain,
          userId,
          teamId,
        },
      });
      await addDomainToVercel(sanitizedDomain);

      return res.status(201).json(response);
    } catch (error) {
      log({
        message: `Failed to add domain. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, userId: ${userId}}\``,
        type: "error",
        mention: true,
      });
      errorhandler(error, res);
    }
  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
