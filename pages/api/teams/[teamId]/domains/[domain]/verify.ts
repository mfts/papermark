import { NextApiRequest, NextApiResponse } from "next";
import {
  getConfigResponse,
  getDomainResponse,
  verifyDomain,
} from "@/lib/domains";
import { DomainVerificationStatusProps, DomainEmailDNSVerificationStatusProps } from "@/lib/types";
import prisma from "@/lib/prisma";
import { analytics, identifyUser, trackAnalytics } from '@/lib/analytics';
import { resend } from '@/lib/resend';
import { GetDomainResponse } from 'resend/build/src/domains/interfaces';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET /api/teams/:teamId/domains/[domain]/verify - get domain verification status
  if (req.method === "GET") {
    const { domain } = req.query as { domain: string; };
    let status: { 
      domainStatus : DomainVerificationStatusProps,
      domainEmailDNSStatus: DomainEmailDNSVerificationStatusProps
    } = {
      domainStatus: "Valid Configuration",
      domainEmailDNSStatus: "Valid Email DNS Configuration"
    }

    const [domainJson, configJson] = await Promise.all([
      getDomainResponse(domain),
      getConfigResponse(domain),
    ]);

    //Domain Verification
    if (domainJson?.error?.code === "not_found") {
      // domain not found on Vercel project
      status.domainStatus = "Domain Not Found";

      // unknown error
    } else if (domainJson.error) {
      status.domainStatus = "Unknown Error";

      // if domain is not verified, we try to verify now
    } else if (!domainJson.verified) {
      status.domainStatus = "Pending Verification";
      const verificationJson = await verifyDomain(domain);

      // domain was just verified
      if (verificationJson && verificationJson.verified) {
        status.domainStatus = "Valid Configuration";
      }
    } else if (configJson.misconfigured) {
      status.domainStatus = "Invalid Configuration";
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
      status.domainStatus = "Valid Configuration";
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

    //Domain email verification 

    const domains = await resend?.domains.list();
    const resendDomain = domains?.data.find((resendDomain)=>resendDomain.name === domain);

    //Propogate resend records to frontend domain card
    let currentDomainVerificationDetails: GetDomainResponse | undefined
    if (resendDomain?.id) {
       currentDomainVerificationDetails = await resend?.domains.get(resendDomain?.id);
    }

    const currentDomain = await prisma.domain.findUnique({
      where: {
        slug: domain,
      },
      select: {
        emailDNSVerified: true,
      }
    });;
    if (!resendDomain) {
      status.domainEmailDNSStatus = "Domain Email DNS Not Created";

      //If domain not verified, we try to verify it
    } else if (resendDomain.status === "not_started" || resendDomain.status === "temporary_failure") {
      status.domainEmailDNSStatus = "Pending Email DNS Verification";
      await resend?.domains.verify(resendDomain.id);      

      //If domain verification failed
    } else if (resendDomain.status === "failed") {
      status.domainEmailDNSStatus = "Invalid Email DNS Configuration";

      //If email DNS is verified update database to false
      if (currentDomain?.emailDNSVerified) {
        await prisma.domain.update({
          where: {
            slug: domain,
          },
          data: {
            emailDNSVerified: false,
            lastChecked: new Date(),
          },
          select: {
            userId: true,
            emailDNSVerified: true,
          }
        });
      }

      //If domain email DNS is pending
    } else if (resendDomain.status === "pending") {
      status.domainEmailDNSStatus = "Pending Email DNS Verification";
    }
    
    //Domain ENS is verified
    else {
      const updatedDomain = await prisma.domain.update({
        where: {
          slug: domain,
        },
        data: {
          emailDNSVerified: true,
          lastChecked: new Date(),
        },
        select: {
          userId: true,
          emailDNSVerified: true,
        }
      });

      if (!(currentDomain?.emailDNSVerified) && updatedDomain.emailDNSVerified) {
        await identifyUser(updatedDomain.userId);
        await trackAnalytics({
          event: "Domain Email Verified",
          slug: domain,
        }).then(() => {
          console.log("Success: Domain Verified event tracked");
        });
      }
    }
        
    return res.status(200).json({
      status,
      domainJson,
      emailDNSRecords: currentDomainVerificationDetails?.records
    });
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}