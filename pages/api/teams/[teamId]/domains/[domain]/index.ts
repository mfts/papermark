import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/pages/api//auth/[...nextauth]";
import { log } from "@/lib/utils";
import { getApexDomain, removeDomainFromVercel } from "@/lib/domains";
import { CustomUser } from "@/lib/types";
import { getTeamWithDomain } from "@/lib/team/helper";
import { errorhandler } from "@/lib/errorHandler";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
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

    // console.log("Deleting domain:", domain);

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
      log(`Failed to delete domain: ${domain}. Error: \n\n ${error}`);
      errorhandler(error, res);
    }
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
