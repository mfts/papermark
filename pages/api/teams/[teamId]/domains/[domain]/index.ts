import { NextApiResponse } from "next";

import { getApexDomain, removeDomainFromVercel } from "@/lib/domains";
import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { getTeamWithDomain } from "@/lib/team/helper";
import { log } from "@/lib/utils";

export default createTeamHandler({
  DELETE: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId, domain } = req.query as { teamId: string; domain: string };
    const userId = req.user.id;

    if (!domain) {
      res.status(400).json("Domain is required for deletion");
      return;
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

      res.status(204).end(); // 204 No Content response for successful deletes
    } catch (error) {
      log({
        message: `Failed to delete domain: _${domain}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, userId: ${userId}}\``,
        type: "error",
        mention: true,
      });
      errorhandler(error, res);
    }
  },
  PATCH: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId, domain } = req.query as { teamId: string; domain: string };
    const userId = req.user.id;

    if (!domain) {
      res.status(400).json("Domain is required for deletion");
      return;
    }

    try {
      const { domain: domainToBeUpdated } = await getTeamWithDomain({
        teamId,
        userId,
        domain,
      });

      if (!domainToBeUpdated) {
        res.status(404).json("Domain not found");
        return;
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

      res.status(200).json({ message: "Domain set to default" });
    } catch (error) {
      log({
        message: `Failed to set domain: _${domain}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, userId: ${userId}}\``,
        type: "error",
        mention: true,
      });
      errorhandler(error, res);
    }
  },
});
