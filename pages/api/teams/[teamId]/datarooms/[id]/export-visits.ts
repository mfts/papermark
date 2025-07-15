import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { exportVisitsTask } from "@/lib/trigger/export-visits";
import { CustomUser } from "@/lib/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    // Changed to POST to trigger background job
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  // get dataroom id and teamId from query params
  const { teamId, id: dataroomId } = req.query as {
    teamId: string;
    id: string;
  };

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

    if (team.plan === "free") {
      return res
        .status(403)
        .json({ message: "This feature is not available for your plan" });
    }

    // Fetching Dataroom based on dataroom.id
    const dataroom = await prisma.dataroom.findUnique({
      where: { id: dataroomId, teamId: teamId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!dataroom) {
      return res.status(404).end("Dataroom not found");
    }

    // Create export job record
    const exportJob = await prisma.exportJob.create({
      data: {
        type: "dataroom",
        resourceId: dataroomId,
        resourceName: dataroom.name,
        userId,
        teamId,
        status: "PENDING",
      },
    });

    // Trigger the background task
    await exportVisitsTask.trigger(
      {
        type: "dataroom",
        teamId,
        resourceId: dataroomId,
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

    return res.status(200).json({
      exportId: exportJob.id,
      status: exportJob.status,
      message: "Export job created successfully. You will be notified when it's ready.",
    });
  } catch (error) {
    console.error("Error creating export job:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}
