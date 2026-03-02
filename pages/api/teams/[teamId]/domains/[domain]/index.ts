import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api//auth/[...nextauth]";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import {
  deleteDomainRedirectUrl,
  setDomainRedirectUrl,
} from "@/lib/api/domains/redis";
import { validateRedirectUrl } from "@/lib/api/domains/validate-redirect-url";
import { getApexDomain, removeDomainFromVercel } from "@/lib/domains";
import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";

const updateDomainSchema = z.object({
  redirectUrl: z.string().nullable().optional(),
});

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "DELETE") {
    // DELETE /api/teams/:teamId/domains/:domain
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    // Assuming the domain slug is sent in the request body.
    const { teamId, domain } = req.query as { teamId: string; domain: string };

    const userId = (session.user as CustomUser).id;

    if (!domain) {
      return res.status(400).json("Domain is required for deletion");
    }

    try {
      const hasTeamAccess = await prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
      });
      if (!hasTeamAccess) {
        return res.status(401).end("Unauthorized");
      }

      const domainToBeDeleted = await prisma.domain.findUnique({
        where: {
          slug: domain,
          teamId,
        },
        select: {
          id: true,
        },
      });
      if (!domainToBeDeleted) {
        return res.status(404).json("Domain not found");
      }

      // calculate the domainCount
      const apexDomain = getApexDomain(`https://${domain}`);
      const domainCount = await prisma.domain.count({
        where: {
          OR: [
            {
              slug: apexDomain,
            },
            {
              slug: {
                endsWith: `.${apexDomain}`,
              },
            },
          ],
        },
      });

      await Promise.allSettled([
        removeDomainFromVercel(domain, domainCount),
        prisma.domain.delete({
          where: {
            id: domainToBeDeleted.id,
          },
        }),
        deleteDomainRedirectUrl(domain),
      ]);

      return res.status(204).end();
    } catch (error) {
      log({
        message: `Failed to delete domain: _${domain}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, userId: ${userId}}\``,
        type: "error",
        mention: true,
      });
      errorhandler(error, res);
    }
  } else if (req.method === "PATCH") {
    // PATCH /api/teams/:teamId/domains/:domain
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    // Assuming the domain slug is sent in the request body.
    const { teamId, domain } = req.query as { teamId: string; domain: string };

    const userId = (session.user as CustomUser).id;

    if (!domain) {
      return res.status(400).json("Domain is required for deletion");
    }

    try {
      const hasTeamAccess = await prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
      });
      if (!hasTeamAccess) {
        return res.status(401).end("Unauthorized");
      }

      const domainToBeUpdated = await prisma.domain.findUnique({
        where: {
          slug: domain,
          teamId,
        },
        select: {
          id: true,
        },
      });
      if (!domainToBeUpdated) {
        return res.status(404).json("Domain not found");
      }

      const updateDefaultPromise = prisma.domain.update({
        where: {
          id: domainToBeUpdated.id,
          teamId: teamId,
        },
        data: {
          isDefault: true,
        },
      });

      const updateNonDefaultPromise = prisma.domain.updateMany({
        where: {
          teamId,
          slug: {
            not: domain,
          },
        },
        data: {
          isDefault: false,
        },
      });

      await Promise.all([updateDefaultPromise, updateNonDefaultPromise]);

      return res.status(200).json({ message: "Domain set to default" }); // 204 No Content response for successful deletes
    } catch (error) {
      log({
        message: `Failed to set domain: _${domain}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, userId: ${userId}}\``,
        type: "error",
        mention: true,
      });
      errorhandler(error, res);
    }
  } else if (req.method === "PUT") {
    // PUT /api/teams/:teamId/domains/:domain - update domain settings (e.g. redirectUrl)
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, domain } = req.query as { teamId: string; domain: string };
    const userId = (session.user as CustomUser).id;

    if (!domain) {
      return res.status(400).json("Domain is required");
    }

    try {
      const hasTeamAccess = await prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
      });
      if (!hasTeamAccess) {
        return res.status(401).end("Unauthorized");
      }

      const domainToBeUpdated = await prisma.domain.findUnique({
        where: {
          slug: domain,
          teamId,
        },
        select: {
          id: true,
        },
      });
      if (!domainToBeUpdated) {
        return res.status(404).json("Domain not found");
      }

      const parsed = updateDomainSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(422)
          .json({ message: parsed.error.issues[0]?.message ?? "Invalid body" });
      }

      const hasRedirectUrl = "redirectUrl" in parsed.data;
      const redirectUrl = parsed.data.redirectUrl;

      let normalizedUrl: string | null | undefined;
      if (hasRedirectUrl) {
        if (redirectUrl) {
          const result = await validateRedirectUrl(redirectUrl, teamId);
          if (!result.valid) {
            return res.status(422).json({ message: result.message });
          }
          normalizedUrl = result.url || null;
        } else {
          normalizedUrl = null;
        }
      }

      const updatedDomain = await prisma.domain.update({
        where: {
          id: domainToBeUpdated.id,
          teamId,
        },
        data: {
          ...(normalizedUrl !== undefined && { redirectUrl: normalizedUrl }),
        },
      });

      if (normalizedUrl !== undefined) {
        await setDomainRedirectUrl(domain, normalizedUrl);
      }

      return res.status(200).json(updatedDomain);
    } catch (error) {
      log({
        message: `Failed to update domain: _${domain}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, userId: ${userId}}\``,
        type: "error",
        mention: true,
      });
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["DELETE", "PATCH", "PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
