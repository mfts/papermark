import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";

import prisma from "@/lib/prisma";
import { downloadJobStore } from "@/lib/redis-download-job-store";
import { CustomUser } from "@/lib/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const { teamId, id: dataroomId } = req.query as {
    teamId: string;
    id: string;
  };

  const userId = (session.user as CustomUser).id;

  if (req.method === "GET") {
    try {
      // Verify team access
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
        return res.status(403).end("Unauthorized to access this team");
      }

      // Get download jobs for this dataroom
      const jobs = await downloadJobStore.getDataroomJobs(
        dataroomId,
        teamId,
        10,
      );

      // Filter to only show relevant jobs for this user
      const userJobs = jobs.filter((job) => {
        // Show user's own jobs
        if (job.userId === userId) {
          // Always show pending/processing jobs
          if (job.status === "PENDING" || job.status === "PROCESSING") {
            return true;
          }

          // Show completed jobs that haven't expired
          if (job.status === "COMPLETED" && job.expiresAt) {
            return new Date(job.expiresAt) > new Date();
          }

          // Show failed jobs from the last hour
          if (job.status === "FAILED") {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            return new Date(job.createdAt) > oneHourAgo;
          }
        }

        return false;
      });

      return res.status(200).json(userJobs);
    } catch (error) {
      console.error("Error fetching download jobs:", error);
      return res.status(500).json({
        error: "Failed to fetch download jobs",
        details: (error as Error).message,
      });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
