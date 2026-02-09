import { NextApiRequest, NextApiResponse } from "next";

import { getDataroomSessionByLinkIdInPagesRouter } from "@/lib/auth/dataroom-auth";
import prisma from "@/lib/prisma";
import { ratelimit } from "@/lib/redis";
import { getIpAddress } from "@/lib/utils/ip";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // 1. IP-based rate limiting (same pattern as OTP endpoints in verify.ts)
  const ipAddress = getIpAddress(req.headers) ?? "unknown";
  const { success } = await ratelimit(10, "1 m").limit(
    `download-by-email-ip:${ipAddress}`,
  );
  if (!success) {
    return res
      .status(429)
      .json({ error: "Too many requests. Try again later." });
  }

  const { linkId, email } = req.body as { linkId?: string; email?: string };
  if (!linkId || !email) {
    return res.status(400).json({ error: "linkId and email are required" });
  }

  // 2. Require a valid dataroom session
  const session = await getDataroomSessionByLinkIdInPagesRouter(req, linkId);
  if (!session) {
    return res.status(401).json({ error: "Session required" });
  }

  // 3. Prevent email enumeration — always return 200 with uniform body
  const view = await prisma.view.findFirst({
    where: {
      linkId,
      viewType: "DATAROOM_VIEW",
      viewerEmail: { equals: email, mode: "insensitive" },
    },
    select: { id: true },
    orderBy: { viewedAt: "desc" },
  });

  return res.status(200).json({ viewId: view?.id ?? null });
}
