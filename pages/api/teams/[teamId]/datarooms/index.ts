import { NextApiRequest, NextApiResponse } from "next";

import { isTeamPausedById } from "@/ee/features/billing/cancellation/lib/is-team-paused";
import { getLimits } from "@/ee/limits/server";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import slugify from "@sindresorhus/slugify";
import { getServerSession } from "next-auth/next";

import { newId } from "@/lib/id-helper";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/datarooms
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const userId = (session.user as CustomUser).id;
    const { teamId, search, status, tags } = req.query as {
      teamId: string;
      search?: string;
      status?: string;
      tags?: string;
    };

    try {
      const teamAccess = await prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId: userId,
            teamId: teamId,
          },
        },
        select: {
          teamId: true,
        },
      });

      if (!teamAccess) {
        return res.status(401).end("Unauthorized");
      }

      // Get total unfiltered count first
      const totalCount = await prisma.dataroom.count({
        where: {
          teamId: teamId,
        },
      });

      // Build where clause based on filters
      const whereClause: any = {
        teamId: teamId,
      };

      // Search filter
      if (search) {
        whereClause.name = {
          contains: search,
          mode: "insensitive",
        };
      }

      // Tags filter
      if (tags) {
        const tagNames = tags.split(",").filter(Boolean);
        if (tagNames.length > 0) {
          whereClause.tags = {
            some: {
              tag: {
                name: {
                  in: tagNames,
                },
              },
            },
          };
        }
      }

      // Check if the user is part of the team
      const datarooms = await prisma.dataroom.findMany({
        where: whereClause,
        include: {
          _count: {
            select: { documents: true, views: true },
          },
          links: {
            where: {
              linkType: "DATAROOM_LINK",
              deletedAt: null,
            },
            orderBy: {
              createdAt: "desc",
            },
            select: {
              id: true,
              isArchived: true,
              expiresAt: true,
              createdAt: true,
            },
          },
          views: {
            orderBy: {
              viewedAt: "desc",
            },
            take: 1,
            select: {
              viewedAt: true,
            },
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                  description: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Status filter (applied after fetching since it's computed)
      let filteredDatarooms = datarooms;
      if (status) {
        filteredDatarooms = datarooms.filter((dataroom) => {
          const activeLinks = dataroom.links.filter((link) => {
            if (link.isArchived) return false;
            if (link.expiresAt && new Date(link.expiresAt) < new Date())
              return false;
            return true;
          });
          const isActive = activeLinks.length > 0;

          if (status === "active") {
            return isActive;
          } else if (status === "inactive") {
            return !isActive;
          }
          return true;
        });
      }

      return res.status(200).json({
        datarooms: filteredDatarooms,
        totalCount,
      });
    } catch (error) {
      console.error("Request error", error);
      return res.status(500).json({ error: "Error fetching datarooms" });
    }
  } else if (req.method === "POST") {
    // POST /api/teams/:teamId/datarooms
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const userId = (session.user as CustomUser).id;

    const { teamId } = req.query as { teamId: string };
    const { name } = req.body as { name: string };

    try {
      // Check if the user is part of the team
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          plan: {
            // exclude all teams not on `business`, `datarooms`, `datarooms-plus`, `datarooms-premium`, `business+old`, `datarooms+old`, `datarooms-plus+old`, `datarooms-premium+old` plan
            in: [
              "business",
              "datarooms",
              "datarooms-plus",
              "datarooms-premium",
              "business+old",
              "datarooms+old",
              "datarooms-plus+old",
              "datarooms-premium+old",
              "datarooms+drtrial",
              "business+drtrial",
              "datarooms-plus+drtrial",
              "datarooms-premium+drtrial",
            ],
          },
          users: {
            some: {
              userId: userId,
            },
          },
        },
      });

      if (!team) {
        return res.status(401).end("Unauthorized");
      }

      // Check if team is paused
      const teamIsPaused = await isTeamPausedById(teamId);
      if (teamIsPaused) {
        return res.status(403).json({
          error:
            "Team is currently paused. New dataroom creation is not available.",
        });
      }

      // Limits: Check if the user has reached the limit of datarooms in the team
      const dataroomCount = await prisma.dataroom.count({
        where: {
          teamId: teamId,
        },
      });

      const limits = await getLimits({ teamId, userId });

      if (limits && dataroomCount >= limits.datarooms) {
        return res
          .status(403)
          .json({ message: "You have reached the limit of datarooms" });
      }

      const pId = newId("dataroom");

      const dataroom = await prisma.dataroom.create({
        data: {
          name: name,
          teamId: teamId,
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
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
