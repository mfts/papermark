import { NextApiRequest, NextApiResponse } from "next";

import { getDataroomSessionByLinkIdInPagesRouter } from "@/lib/auth/dataroom-auth";
import prisma from "@/lib/prisma";
import { downloadJobStore } from "@/lib/redis-download-job-store";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const linkId = req.query.linkId as string;
  if (!linkId) {
    return res.status(400).json({ error: "linkId is required" });
  }

  const session = await getDataroomSessionByLinkIdInPagesRouter(req, linkId);
  if (!session) {
    return res.status(401).json({ error: "Session required" });
  }

  const view = await prisma.view.findUnique({
    where: { id: session.viewId },
    select: { viewerEmail: true },
  });
  if (!view?.viewerEmail) {
    return res.status(200).json([]);
  }

  const jobs = await downloadJobStore.getViewerJobs(
    linkId,
    view.viewerEmail,
    20,
  );

  return res.status(200).json(jobs);
}
