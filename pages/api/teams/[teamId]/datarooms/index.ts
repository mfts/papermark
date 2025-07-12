import { NextApiResponse } from "next";

import { getLimits } from "@/ee/limits/server";
import slugify from "@sindresorhus/slugify";

import { newId } from "@/lib/id-helper";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // GET /api/teams/:teamId/datarooms
    try {
      const datarooms = await prisma.dataroom.findMany({
        where: {
          teamId: req.team!.id,
        },
        include: {
          _count: {
            select: { documents: true, views: true },
          },
        },
      });

      res.status(200).json(datarooms);
    } catch (error) {
      console.error("Request error", error);
      res.status(500).json({ error: "Error fetching datarooms" });
    }
  },
  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // POST /api/teams/:teamId/datarooms
    const { name } = req.body as { name: string };

    try {
      // Check plan restrictions for datarooms
      const allowedPlans = [
        "business",
        "datarooms",
        "datarooms-plus",
        "business+old",
        "datarooms+old",
        "datarooms-plus+old",
        "datarooms+drtrial",
        "business+drtrial",
        "datarooms-plus+drtrial",
      ];

      if (!allowedPlans.includes(req.team!.plan)) {
        res
          .status(403)
          .json({ message: "Datarooms are not available for your plan" });
        return;
      }

      // Limits: Check if the user has reached the limit of datarooms in the team
      const dataroomCount = await prisma.dataroom.count({
        where: {
          teamId: req.team!.id,
        },
      });

      const limits = await getLimits({
        teamId: req.team!.id,
        userId: req.user.id,
      });

      if (limits && dataroomCount >= limits.datarooms) {
        res
          .status(403)
          .json({ message: "You have reached the limit of datarooms" });
        return;
      }

      const pId = newId("dataroom");

      const dataroom = await prisma.dataroom.create({
        data: {
          name: name,
          teamId: req.team!.id,
          pId: pId,
        },
      });

      const dataroomWithCount = {
        ...dataroom,
        _count: { documents: 0 },
      };

      res.status(201).json({ dataroom: dataroomWithCount });
    } catch (error) {
      console.error("Request error", error);
      res.status(500).json({ error: "Error creating dataroom" });
    }
  },
});
