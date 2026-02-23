import { NextApiRequest, NextApiResponse } from "next";

import dns from "dns/promises";
import { getServerSession } from "next-auth/next";

import { validDomainRegex } from "@/lib/domains";
import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { getTeamWithDomain } from "@/lib/team/helper";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../../../../auth/[...nextauth]";

type DomainValidationStatus =
  | "invalid"
  | "has site"
  | "available";

const sanitizeDomain = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^(?:https?:\/\/)?(?:www\.)?/i, "")
    .split("/")[0];

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const { teamId } = req.query as { teamId: string };
  const rawDomain = Array.isArray(req.query.domain)
    ? req.query.domain[0]
    : req.query.domain;

  if (!teamId || !rawDomain) {
    return res.status(400).json({ status: "invalid" });
  }

  const userId = (session.user as CustomUser).id;

  try {
    await getTeamWithDomain({ teamId, userId });

    const sanitizedDomain = sanitizeDomain(rawDomain);

    if (
      !sanitizedDomain ||
      !validDomainRegex.test(sanitizedDomain) ||
      sanitizedDomain.includes("papermark")
    ) {
      return res.status(200).json({
        status: "invalid" as DomainValidationStatus,
      });
    }

    const existingDomain = await prisma.domain.findFirst({
      where: {
        slug: sanitizedDomain,
      },
      select: {
        id: true,
      },
    });

    if (existingDomain) {
      return res.status(200).json({
        status: "has site" as DomainValidationStatus,
      });
    }

    const hasSite = await hasSiteConfigured(sanitizedDomain);
    if (hasSite) {
      return res.status(200).json({
        status: "has site" as DomainValidationStatus,
      });
    }

    return res.status(200).json({
      status: "available" as DomainValidationStatus,
    });
  } catch (error) {
    errorhandler(error, res);
  }
}

async function hasSiteConfigured(domain: string): Promise<boolean> {
  try {
    const urls = [`https://${domain}`, `http://${domain}`];

    for (const url of urls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(url, {
          method: "HEAD",
          signal: controller.signal,
          redirect: "manual",
        });
        clearTimeout(timeoutId);
        // Any response (including redirects) means a site is configured
        if (response.status < 500) return true;
      } catch {
        // Timeout, network error, or certificate error – try next URL
        continue;
      }
    }

    const dnsPromise = dns.resolve(domain);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("DNS Timeout")), 3000),
    );

    try {
      const records = (await Promise.race([
        dnsPromise,
        timeoutPromise,
      ])) as string[];
      return records.length > 0;
    } catch (error) {
      return false;
    }
  } catch (error) {
    return false;
  }
}
