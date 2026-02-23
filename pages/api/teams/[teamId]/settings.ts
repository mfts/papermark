import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../../auth/[...nextauth]";

// Validate IANA timezone by attempting to use it with Intl.DateTimeFormat
const isValidIANATimezone = (tz: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

const updateSettingsSchema = z.object({
  timezone: z
    .string()
    .refine(isValidIANATimezone, (tz) => ({
      message: `Invalid timezone: "${tz}" is not a valid IANA timezone identifier. Examples of valid timezones: "America/New_York", "Europe/London", "Asia/Tokyo".`,
    }))
    .optional(),
  replicateDataroomFolders: z.boolean().optional(),
  enableExcelAdvancedMode: z.boolean().optional(),
});

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const { teamId } = req.query as { teamId: string };
  const userId = (session.user as CustomUser).id;

  // Verify user has access to the team
  const teamAccess = await prisma.userTeam.findUnique({
    where: {
      userId_teamId: {
        userId: userId,
        teamId: teamId,
      },
    },
    select: { teamId: true, role: true },
  });

  if (!teamAccess) {
    return res.status(401).end("Unauthorized");
  }

  if (req.method === "GET") {
    // GET /api/teams/:teamId/settings
    try {
      // Fetch only the settings fields
      const teamSettings = await prisma.team.findUnique({
        where: {
          id: teamId,
        },
        select: {
          replicateDataroomFolders: true,
          enableExcelAdvancedMode: true,
          timezone: true,
        },
      });

      if (!teamSettings) {
        return res.status(404).json({ error: "Team not found" });
      }

      return res.status(200).json(teamSettings);
    } catch (error) {
      errorhandler(error, res);
    }
  } else if (req.method === "PATCH") {
    // PATCH /api/teams/:teamId/settings
    // Only admins and managers can update settings
    if (teamAccess.role !== "ADMIN" && teamAccess.role !== "MANAGER") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    try {
      const result = updateSettingsSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .json({ error: `Invalid body: ${result.error.message}` });
      }

      const { timezone, replicateDataroomFolders, enableExcelAdvancedMode } =
        result.data;

      // Build update object with only provided fields
      const updateData: {
        timezone?: string;
        replicateDataroomFolders?: boolean;
        enableExcelAdvancedMode?: boolean;
      } = {};

      if (timezone !== undefined) {
        updateData.timezone = timezone;
      }
      if (replicateDataroomFolders !== undefined) {
        updateData.replicateDataroomFolders = replicateDataroomFolders;
      }
      if (enableExcelAdvancedMode !== undefined) {
        updateData.enableExcelAdvancedMode = enableExcelAdvancedMode;
      }

      const updatedTeam = await prisma.team.update({
        where: {
          id: teamId,
        },
        data: updateData,
        select: {
          replicateDataroomFolders: true,
          enableExcelAdvancedMode: true,
          timezone: true,
        },
      });

      return res.status(200).json(updatedTeam);
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["GET", "PATCH"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
