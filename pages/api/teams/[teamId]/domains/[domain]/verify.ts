import { NextApiRequest, NextApiResponse } from "next";

import { waitUntil } from "@vercel/functions";

import { trackAnalytics } from "@/lib/analytics";
import {
  getConfigResponse,
  getDomainResponse,
  verifyDomain,
} from "@/lib/domains";
import prisma from "@/lib/prisma";
import { DomainVerificationStatusProps } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
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
      return res.status(200).json({
        status,
        response: { domainJson, configJson },
      });
      // unknown error
    } else if (domainJson.error) {
      status = "Unknown Error";
      return res.status(200).json({
        status,
        response: { domainJson, configJson },
      });
    }

    /**
     * Domain has DNS conflicts
     */
    if (configJson?.conflicts.length > 0) {
      status = "Conflicting DNS Records";
      return res.status(200).json({
        status,
        response: { domainJson, configJson },
      });
    }

    /**
     * If domain is not verified, we try to verify now
     */
    if (!domainJson.verified) {
      status = "Pending Verification";
      const verificationJson = await verifyDomain(domain);

      // domain was just verified
      if (verificationJson && verificationJson.verified) {
        status = "Valid Configuration";
      }

      return res.status(200).json({
        status,
        response: { domainJson, configJson },
      });
    }

    if (!configJson.misconfigured) {
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
        waitUntil(trackAnalytics({ event: "Domain Verified", slug: domain }));
      }
    } else {
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
    }

    return res.status(200).json({
      status,
      response: { domainJson, configJson },
    });
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
