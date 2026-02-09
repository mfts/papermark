import { NextApiRequest, NextApiResponse } from "next";

import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const linkId = req.query.linkId as string;
  const email = req.query.email as string;
  if (!linkId || !email) {
    return res.status(400).json({ error: "linkId and email are required" });
  }

  const view = await prisma.view.findFirst({
    where: {
      linkId,
      viewType: "DATAROOM_VIEW",
      viewerEmail: { equals: email, mode: "insensitive" },
    },
    select: { id: true },
    orderBy: { viewedAt: "desc" },
  });

  if (!view) {
    return res.status(404).json({ error: "No view found for this link and email" });
  }

  return res.status(200).json({ viewId: view.id });
}
