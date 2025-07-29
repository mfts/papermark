import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { exportVisitsTask } from "@/lib/trigger/export-visits";
import { jobStore } from "@/lib/redis-job-store";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const { teamId } = req.query as { teamId: string };
  const userId = (session.user as CustomUser).id;

  if (req.method === "POST") {
    // Trigger a new export job
    const { type, resourceId, groupId } = req.body as {
      type: "document" | "dataroom" | "dataroom-group";
      resourceId: string;
      groupId?: string;
    };

    if (!type || !resourceId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // Verify team access
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId: userId,
            },
          },
        },
        select: { plan: true },
      });

      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      if (team.plan === "free") {
        return res.status(403).json({ 
          error: "This feature is not available for your plan" 
        });
      }

      // Create export job record
      const exportJob = await jobStore.createJob({
        type,
        resourceId,
        groupId,
        userId,
        teamId,
        status: "PENDING",
      });

      // Trigger the background task
      const handle = await exportVisitsTask.trigger(
        {
          type,
          teamId,
          resourceId,
          groupId,
          userId,
          exportId: exportJob.id,
        },
        {
          idempotencyKey: exportJob.id,
          tags: [
            `team_${teamId}`,
            `user_${userId}`,
            `export_${exportJob.id}`,
          ],
        },
      );

      // Update the job with the trigger run ID for cancellation
      const updatedJob = await jobStore.updateJob(exportJob.id, {
        triggerRunId: handle.id,
      });

      return res.status(200).json({
        exportId: updatedJob?.id || exportJob.id,
        status: updatedJob?.status || exportJob.status,
        message: "Export job created successfully",
      });
    } catch (error) {
      console.error("Error creating export job:", error);
      return res.status(500).json({ error: "Failed to create export job" });
    }
  }

  if (req.method === "GET") {
    // Get export jobs for the team
    try {
      const exportJobs = await jobStore.getUserTeamJobs(userId, teamId, 20);

      return res.status(200).json(exportJobs);
    } catch (error) {
      console.error("Error fetching export jobs:", error);
      return res.status(500).json({ error: "Failed to fetch export jobs" });
    }
  }

  res.setHeader("Allow", ["POST", "GET"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}