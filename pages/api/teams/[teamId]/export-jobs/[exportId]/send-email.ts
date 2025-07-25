import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { sendExportReadyEmail } from "@/lib/emails/send-export-ready-email";
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

  if (req.method === "POST") {
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

      // Check if user has email
      if (!session.user?.email) {
        return res.status(400).json({ error: "User email not found" });
      }

      // Store email notification flag
      await jobStore.updateJob(exportId, {
        emailNotification: true,
        emailAddress: session.user.email,
      });

      // If job is already completed, send email immediately
      if (exportJob.status === "COMPLETED" && exportJob.result) {
        await sendExportReadyEmail({
          to: session.user.email,
          resourceName: exportJob.resourceName || "Export",
          downloadUrl: `${process.env.NEXTAUTH_URL}/api/teams/${teamId}/export-jobs/${exportId}?download=true`,
        });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error setting up email notification:", error);
      return res
        .status(500)
        .json({ error: "Failed to setup email notification" });
    }
  }

  res.setHeader("Allow", ["POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
