import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { jobStore } from "@/lib/redis-job-store";
import { exportVisitsTask } from "@/lib/trigger/export-visits";
import { CustomUser } from "@/lib/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, id: docId } = req.query as {
      teamId: string;
      id: string;
    };
    const userId = (session.user as CustomUser).id;

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
        return res.status(404).end("Team not found");
      }

      // Get existing exports for this document
      const existingExports = await jobStore.getResourceJobs(
        docId,
        teamId,
        "document",
        undefined,
        10,
      );

      return res.status(200).json(existingExports);
    } catch (error) {
      console.error("Error fetching existing exports:", error);
      return res
        .status(500)
        .json({ message: "Failed to fetch existing exports" });
    }
  }

  if (req.method !== "POST") {
    // Changed to POST to trigger background job
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  // get document id and teamId from query params
  const { teamId, id: docId } = req.query as { teamId: string; id: string };

  const userId = (session.user as CustomUser).id;

  try {
    // Fetching Team based on team.id
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
      return res.status(404).end("Team not found");
    }

    if (team.plan.includes("free")) {
      return res
        .status(403)
        .json({ message: "This feature is not available for your plan" });
    }

    // Fetching Document based on document.id
    const document = await prisma.document.findUnique({
      where: { id: docId, teamId: teamId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!document) {
      return res.status(404).end("Document not found");
    }

    // Create export job record
    const exportJob = await jobStore.createJob({
      type: "document",
      resourceId: docId,
      resourceName: document.name,
      userId,
      teamId,
      status: "PENDING",
    });

    // Trigger the background task
    const handle = await exportVisitsTask.trigger(
      {
        type: "document",
        teamId,
        resourceId: docId,
        userId,
        exportId: exportJob.id,
      },
      {
        idempotencyKey: exportJob.id,
        tags: [`team_${teamId}`, `user_${userId}`, `export_${exportJob.id}`],
      },
    );

    // Update the job with the trigger run ID for cancellation
    const updatedJob = await jobStore.updateJob(exportJob.id, {
      triggerRunId: handle.id,
    });

    return res.status(200).json({
      exportId: updatedJob?.id || exportJob.id,
      status: updatedJob?.status || exportJob.status,
      message:
        "Export job created successfully. You will be notified when it's ready.",
    });
  } catch (error) {
    console.error("Error creating export job:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}
