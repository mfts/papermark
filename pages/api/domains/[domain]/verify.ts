import { NextApiRequest, NextApiResponse } from 'next';
import {
  getConfigResponse,
  getDomainResponse,
  verifyDomain,
} from "@/lib/domains";
import { CustomUser, DomainVerificationStatusProps } from "@/lib/types";
import prisma from "@/lib/prisma";
import { analytics, identifyUser, trackAnalytics } from '@/lib/analytics';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  // GET /api/domains/[domain]/verify - get domain verification status
  if (req.method === "GET") {
    const { domain } = req.query as { domain: string; };
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
      await prisma.domain.update({
        where: {
          slug: domain,
        },
        data: {
          verified: true,
          lastChecked: new Date(),
        },
      });

      // TODO: cannot identify user here because we don't have the session
      // await identifyUser((session.user as CustomUser).id);
      await analytics.identify();
      await trackAnalytics({
        event: "Domain Verified",
        slug: domain,
      });
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
