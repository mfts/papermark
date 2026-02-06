import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";
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
  dealTypeOther: z.string().max(200).optional().nullable(), // Custom text when "other" is selected
  dealSize: z
    .enum(["0-500k", "500k-5m", "5m-10m", "10m-100m", "100m+"])
    .optional()
    .nullable(),
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

  try {
    await getTeamWithUsersAndDocument({
      teamId,
      userId,
      options: {},
    });
  } catch (error) {
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
      });
    } catch (error) {
      errorhandler(error, res);
    }
  }

  if (req.method === "POST") {
    try {
      const { dealType, dealTypeOther, dealSize } = req.body;

      // Validate with Zod
      const validationResult = surveyDataSchema.safeParse({
        dealType,
        dealTypeOther,
        dealSize,
      });

      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid survey data",
          details: validationResult.error.errors,
        });
      }

      // Get current survey data to merge with new data
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { surveyData: true },
      });

      const currentSurveyData = (team?.surveyData as SurveyData) || {};

      // Merge new data with existing data
      const updatedSurveyData: SurveyData = {
        ...currentSurveyData,
        ...(dealType !== undefined && { dealType }),
        ...(dealTypeOther !== undefined && { dealTypeOther }),
        ...(dealSize !== undefined && { dealSize }),
      };

      await prisma.team.update({
        where: { id: teamId },
        data: {
          surveyData: updatedSurveyData,
        },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      errorhandler(error, res);
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
