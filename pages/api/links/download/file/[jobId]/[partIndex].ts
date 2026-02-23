import { NextApiRequest, NextApiResponse } from "next";

import { getDataroomSessionByLinkIdInPagesRouter } from "@/lib/auth/dataroom-auth";
import { generateFreshPresignedUrl } from "@/lib/files/bulk-download-presign";
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
  const { jobId, partIndex } = req.query as {
    jobId: string;
    partIndex: string;
  };
  if (!linkId || !jobId || partIndex == null) {
    return res
      .status(400)
      .json({ error: "linkId, jobId and partIndex required" });
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
    return res.status(403).json({ error: "Viewer email not found" });
  }

  const job = await downloadJobStore.getJob(jobId);
  if (!job) {
    return res
      .status(404)
      .json({ error: "Download job not found or expired" });
  }

  if (
    job.linkId !== linkId ||
    job.viewerEmail?.toLowerCase().trim() !==
      view.viewerEmail?.toLowerCase().trim()
  ) {
    return res
      .status(403)
      .json({ error: "Job does not belong to this viewer" });
  }

  if (job.status !== "COMPLETED" || !job.downloadUrls?.length) {
    return res.status(400).json({ error: "Download not ready" });
  }

  const index = parseInt(partIndex, 10);
  if (Number.isNaN(index) || index < 0 || index >= job.downloadUrls.length) {
    return res.status(400).json({ error: "Invalid part index" });
  }

  // Generate a fresh presigned URL using long-term IAM credentials
  // to avoid the Lambda STS token expiration issue
  const s3Key = job.downloadS3Keys?.[index];
  if (s3Key && job.teamId) {
    try {
      const freshUrl = await generateFreshPresignedUrl(job.teamId, s3Key);
      return res.redirect(302, freshUrl);
    } catch (error) {
      console.error("Failed to generate fresh presigned URL:", error);
    }
  }

  // Fallback to stored presigned URL (may fail if STS token expired)
  const presignedUrl = job.downloadUrls[index];
  res.redirect(302, presignedUrl);
}
