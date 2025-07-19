import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { jobStore } from "@/lib/redis-job-store";
import { CustomUser } from "@/lib/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const { teamId, exportId } = req.query as {
    teamId: string;
    exportId: string;
  };
  const userId = (session.user as CustomUser).id;

  if (req.method === "GET") {
    try {
      // Get export job details
      const exportJob = await jobStore.getJob(exportId);

      if (
        !exportJob ||
        exportJob.teamId !== teamId ||
        exportJob.userId !== userId
      ) {
        return res.status(404).json({ error: "Export job not found" });
      }

      // Check if client wants to download the CSV
      const { download } = req.query;
      if (
        download === "true" &&
        exportJob.status === "COMPLETED" &&
        exportJob.result
      ) {
        // Redirect directly to the blob URL
        return res.redirect(302, exportJob.result);
      }

      // Return job status
      return res.status(200).json({
        id: exportJob.id,
        type: exportJob.type,
        status: exportJob.status,
        resourceId: exportJob.resourceId,
        resourceName: exportJob.resourceName,
        groupId: exportJob.groupId,
        error: exportJob.error,
        createdAt: exportJob.createdAt,
        updatedAt: exportJob.updatedAt,
        completedAt: exportJob.completedAt,
        isReady: exportJob.status === "COMPLETED" && !!exportJob.result,
      });
    } catch (error) {
      console.error("Error fetching export job:", error);
      return res.status(500).json({ error: "Failed to fetch export job" });
    }
  }

  if (req.method === "DELETE") {
    try {
      // Get the job first to verify ownership
      const exportJob = await jobStore.getJob(exportId);

      if (
        !exportJob ||
        exportJob.teamId !== teamId ||
        exportJob.userId !== userId
      ) {
        return res.status(404).json({ error: "Export job not found" });
      }

      // Delete export job
      await jobStore.deleteJob(exportId);

      return res
        .status(200)
        .json({ message: "Export job deleted successfully" });
    } catch (error) {
      console.error("Error deleting export job:", error);
      return res.status(500).json({ error: "Failed to delete export job" });
    }
  }

  res.setHeader("Allow", ["GET", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
