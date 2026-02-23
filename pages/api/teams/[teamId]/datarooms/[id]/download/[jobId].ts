import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";

import { generateFreshPresignedUrl } from "@/lib/files/bulk-download-presign";
import prisma from "@/lib/prisma";
import { downloadJobStore } from "@/lib/redis-download-job-store";
import { CustomUser } from "@/lib/types";

// Status polling endpoint for download progress modal
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const {
    teamId,
    id: dataroomId,
    jobId,
  } = req.query as {
    teamId: string;
    id: string;
    jobId: string;
  };

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = (session.user as CustomUser).id;

  try {
    // Verify user has access to the team
    const teamAccess = await prisma.userTeam.findUnique({
      where: {
        userId_teamId: {
          userId: userId,
          teamId: teamId,
        },
      },
      select: { teamId: true },
    });

    if (!teamAccess) {
      return res
        .status(403)
        .json({ error: "Unauthorized to access this team" });
    }

    // Fetch the job from Redis
    const job = await downloadJobStore.getJob(jobId);

    if (!job) {
      return res
        .status(404)
        .json({ error: "Download job not found or expired" });
    }

    // Verify the job belongs to this team and dataroom
    if (job.teamId !== teamId || job.dataroomId !== dataroomId) {
      return res
        .status(403)
        .json({ error: "Job does not belong to this dataroom" });
    }

    // Generate fresh presigned URLs using long-term IAM credentials
    let freshDownloadUrls: string[] | undefined;
    if (
      job.status === "COMPLETED" &&
      job.downloadS3Keys?.length &&
      job.downloadUrls?.length
    ) {
      try {
        freshDownloadUrls = await Promise.all(
          job.downloadS3Keys.map((s3Key) =>
            generateFreshPresignedUrl(teamId, s3Key),
          ),
        );
      } catch (error) {
        console.error("Failed to generate fresh presigned URLs:", error);
        freshDownloadUrls = job.downloadUrls;
      }
    }

    // Return full status for polling
    return res.status(200).json({
      id: job.id,
      status: job.status,
      progress: job.progress,
      totalFiles: job.totalFiles,
      processedFiles: job.processedFiles,
      downloadUrls:
        job.status === "COMPLETED"
          ? (freshDownloadUrls ?? job.downloadUrls)
          : undefined,
      error: job.status === "FAILED" ? job.error : undefined,
      isReady: job.status === "COMPLETED" && !!job.downloadUrls?.length,
      dataroomName: job.dataroomName,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      expiresAt: job.expiresAt,
    });
  } catch (error) {
    console.error("Error fetching download:", error);
    return res.status(500).json({
      error: "Failed to fetch download",
      details: (error as Error).message,
    });
  }
}
