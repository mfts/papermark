import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api//auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { getApexDomain, removeDomainFromVercel } from "@/lib/domains";
import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { getTeamWithDomain } from "@/lib/team/helper";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";

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
      const { domain: domainToBeDeleted } = await getTeamWithDomain({
        teamId,
        userId,
        domain,
      });

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
            id: domainToBeDeleted?.id,
          },
        }),
      ]);

      return res.status(204).end(); // 204 No Content response for successful deletes
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
      const { domain: domainToBeUpdated } = await getTeamWithDomain({
        teamId,
        userId,
        domain,
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
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["DELETE", "PATCH"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
