import { NextApiRequest, NextApiResponse } from "next";
import {
  getConfigResponse,
  getDomainResponse,
  verifyDomain,
} from "@/lib/domains";
import { DomainVerificationStatusProps } from "@/lib/types";
import prisma from "@/lib/prisma";
import { analytics, identifyUser, trackAnalytics } from "@/lib/analytics";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET /api/teams/:teamId/domains/[domain]/verify - get domain verification status
  if (req.method === "GET") {
    const { domain } = req.query as { domain: string };
    let status: DomainVerificationStatusProps = "Valid Configuration";

    const [domainJson, configJson] = await Promise.all([
      getDomainResponse(domain),
      getConfigResponse(domain),
    ]);

    if (domainJson?.error?.code === "not_found") {
      // domain not found on Vercel project
      status = "Domain Not Found";

      // unknown error
    } else if (domainJson.error) {
      status = "Unknown Error";

      // if domain is not verified, we try to verify now
    } else if (!domainJson.verified) {
      status = "Pending Verification";
      const verificationJson = await verifyDomain(domain);

      // domain was just verified
      if (verificationJson && verificationJson.verified) {
        status = "Valid Configuration";
      }
    } else if (configJson.misconfigured) {
      status = "Invalid Configuration";
      await prisma.domain.update({
        where: {
          slug: domain,
        },
        data: {
          verified: false,
          lastChecked: new Date(),
        },
      });
    } else {
      status = "Valid Configuration";
      const currentDomain = await prisma.domain.findUnique({
        where: {
          slug: domain,
        },
        select: {
          verified: true,
        },
      });

      const updatedDomain = await prisma.domain.update({
        where: {
          slug: domain,
        },
        data: {
          verified: true,
          lastChecked: new Date(),
        },
        select: {
          userId: true,
          verified: true,
        },
      });

      if (!currentDomain!.verified && updatedDomain.verified) {
        await identifyUser(updatedDomain.userId);
        await trackAnalytics({
          event: "Domain Verified",
          slug: domain,
        }).then(() => {
          console.log("Success: Domain Verified event tracked");
        });
      }
    }

    return res.status(200).json({
      status,
      domainJson,
    });
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
