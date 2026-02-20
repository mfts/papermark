import { NextApiRequest, NextApiResponse } from "next";

import { setDomainRedirectUrl } from "@/lib/api/domains/redis";
import prisma from "@/lib/prisma";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const domains = await prisma.domain.findMany({
      where: {
        redirectUrl: { not: null },
      },
      select: {
        slug: true,
        redirectUrl: true,
      },
    });

    await Promise.all(
      domains.map((domain) =>
        setDomainRedirectUrl(domain.slug, domain.redirectUrl),
      ),
    );

    return res.status(200).json({
      message: `Synced ${domains.length} domain redirect(s) to Redis`,
      domains: domains.map((d) => d.slug),
    });
  } catch (error) {
    console.error("Failed to sync domain redirects:", error);
    return res.status(500).json({ error: "Failed to sync domain redirects" });
  }
}
