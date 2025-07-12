import { NextApiResponse } from "next";

import { addDomainToVercel, validDomainRegex } from "@/lib/domains";
import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { getTeamWithDomain } from "@/lib/team/helper";
import { log } from "@/lib/utils";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId } = req.query as { teamId: string };

    try {
      const { team } = await getTeamWithDomain({
        teamId,
        userId: req.user.id,
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
      res.status(200).json(domains);
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
      await getTeamWithDomain({
        teamId,
        userId: req.user.id,
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
        res.status(422).json("Invalid domain");
        return;
      }

      // Check if domain contains papermark
      if (sanitizedDomain.toLowerCase().includes("papermark")) {
        res.status(400).json({ message: "Domain cannot contain 'papermark'" });
        return;
      }

      // Check if domain already exists
      const existingDomain = await prisma.domain.findFirst({
        where: {
          slug: sanitizedDomain,
        },
      });

      if (existingDomain) {
        res.status(400).json({ message: "Domain already exists" });
        return;
      }

      const response = await prisma.domain.create({
        data: {
          slug: sanitizedDomain,
          userId: req.user.id,
          teamId,
        },
      });
      await addDomainToVercel(sanitizedDomain);

      res.status(201).json(response);
    } catch (error) {
      log({
        message: `Failed to add domain. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, userId: ${req.user.id}}\``,
        type: "error",
        mention: true,
      });
      errorhandler(error, res);
    }
  },
});
