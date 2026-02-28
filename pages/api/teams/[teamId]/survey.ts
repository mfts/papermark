import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

// Zod schema for survey data - flexible for future options
const surveyDataSchema = z.object({
  dealType: z
    .enum([
      "startup-fundraising",
      "fund-management",
      "mergers-acquisitions",
      "project-management",
      "sales",
      "financial-operations",
      "real-estate",
      "other",
    ])
    .optional()
    .nullable(),
  dealTypeOther: z.string().max(200).optional().nullable(),
  dealSize: z
    .enum(["0-500k", "500k-5m", "5m-10m", "10m-100m", "100m+"])
    .optional()
    .nullable(),
  dismissed: z.boolean().optional().nullable(),
  dismissedAt: z.string().datetime().optional().nullable(),
  dismissedBy: z.string().optional().nullable(),
});

export type SurveyData = z.infer<typeof surveyDataSchema>;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { teamId } = req.query as { teamId: string };
  const userId = (session.user as CustomUser).id;

  const teamAccess = await prisma.userTeam.findUnique({
    where: {
      userId_teamId: {
        userId,
        teamId,
      },
    },
  });

  if (!teamAccess) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (req.method === "GET") {
    try {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { surveyData: true },
      });

      const surveyData = (team?.surveyData as SurveyData) || {};

      return res.status(200).json({
        dealType: surveyData.dealType || null,
        dealTypeOther: surveyData.dealTypeOther || null,
        dealSize: surveyData.dealSize || null,
        dismissed: surveyData.dismissed || false,
        dismissedAt: surveyData.dismissedAt || null,
        dismissedBy: surveyData.dismissedBy || null,
      });
    } catch (error) {
      return errorhandler(error, res);
    }
  } else if (req.method === "POST") {
    try {
      const validationResult = surveyDataSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid survey data",
          details: validationResult.error.errors,
        });
      }

      const { dealType, dealTypeOther, dealSize, dismissed, dismissedAt } =
        validationResult.data;

      // Get current survey data to merge with new data
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { surveyData: true },
      });

      const currentSurveyData = (team?.surveyData as SurveyData) || {};

      const isSurveyComplete =
        (dealType ?? currentSurveyData.dealType) &&
        ((dealType ?? currentSurveyData.dealType) === "project-management" ||
          (dealSize ?? currentSurveyData.dealSize));

      const updatedSurveyData: SurveyData = {
        ...currentSurveyData,
        ...(dealType !== undefined && { dealType }),
        ...(dealTypeOther !== undefined && { dealTypeOther }),
        ...(dealSize !== undefined && { dealSize }),
        ...(dismissed !== undefined && { dismissed }),
        ...(dismissedAt !== undefined && { dismissedAt }),
        ...(dismissed && { dismissedBy: userId }),
        ...(isSurveyComplete &&
          currentSurveyData.dismissed && {
            dismissed: null,
            dismissedAt: null,
            dismissedBy: null,
          }),
      };

      await prisma.team.update({
        where: { id: teamId },
        data: {
          surveyData: updatedSurveyData,
        },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      return errorhandler(error, res);
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
