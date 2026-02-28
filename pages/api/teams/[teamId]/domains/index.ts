import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth/next";

import {
  planSupportsRedirects,
  setDomainRedirectUrl,
} from "@/lib/api/domains/redis";
import { validateRedirectUrl } from "@/lib/api/domains/validate-redirect-url";
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
            redirectUrl: true,
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
      const { team } = await getTeamWithDomain({
        teamId,
        userId,
      });

      const { domain, redirectUrl } = req.body;

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

      let validatedRedirectUrl: string | undefined;
      if (redirectUrl) {
        if (!planSupportsRedirects(team.plan)) {
          return res.status(403).json({
            message:
              "Root domain redirects require a Business plan or higher",
          });
        }
        const result = await validateRedirectUrl(redirectUrl, teamId);
        if (!result.valid) {
          return res.status(422).json({ message: result.message });
        }
        validatedRedirectUrl = result.url || undefined;
      }

      const response = await prisma.domain.create({
        data: {
          slug: sanitizedDomain,
          userId,
          teamId,
          ...(validatedRedirectUrl && { redirectUrl: validatedRedirectUrl }),
        },
      });
      await addDomainToVercel(sanitizedDomain);

      if (validatedRedirectUrl) {
        try {
          await setDomainRedirectUrl(sanitizedDomain, validatedRedirectUrl);
        } catch {
          // Domain is functional but redirect failed to persist in Redis.
          // Remove redirectUrl from DB so the two stores stay consistent.
          await prisma.domain.update({
            where: { id: response.id },
            data: { redirectUrl: null },
          });
        }
      }

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
