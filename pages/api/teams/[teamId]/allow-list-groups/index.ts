import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";
import { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";

export default async function handle(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method === "GET") {
        // GET /api/teams/:teamId/allow-list-groups
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(401).end("Unauthorized");
        }

        const { teamId, page, limit, search, all } = req.query as {
            teamId: string;
            page?: string;
            limit?: string;
            search?: string;
            all?: string;
        };

        const pageNum = parseInt(page || "1", 10);
        const limitNum = parseInt(limit || "10", 10);
        const returnAll = all === "true";

        try {
            // Check if user is part of the team
            const team = await prisma.team.findUnique({
                where: {
                    id: teamId,
                    users: {
                        some: {
                            userId: (session.user as any).id,
                        },
                    },
                },
            });

            if (!team) {
                return res.status(403).json({ error: "Unauthorized" });
            }

            const whereClause: Prisma.AllowListGroupWhereInput = {
                teamId,
                ...(search && {
                    name: { contains: search, mode: "insensitive" },
                }),
            };

            if (returnAll) {
                const groups = await prisma.allowListGroup.findMany({
                    where: whereClause,
                    include: {
                        _count: {
                            select: {
                                links: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                });

                return res.status(200).json(groups);
            } else {
                // Return paginated results (for main listing page)
                const [groups, total] = await prisma.$transaction([
                    prisma.allowListGroup.findMany({
                        where: whereClause,
                        include: {
                            _count: {
                                select: {
                                    links: true,
                                },
                            },
                        },
                        orderBy: {
                            createdAt: "desc",
                        },
                        skip: (pageNum - 1) * limitNum,
                        take: limitNum,
                    }),
                    prisma.allowListGroup.count({ where: whereClause }),
                ]);

                return res.status(200).json({
                    groups,
                    pagination: {
                        total,
                        page: pageNum,
                        limit: limitNum,
                        totalPages: Math.ceil(total / limitNum),
                        hasNext: pageNum < Math.ceil(total / limitNum),
                        hasPrev: pageNum > 1,
                    },
                });
            }
        } catch (error) {
            log({
                message: `Failed to get allow list groups for team ${teamId}. \n\n Error: ${error} \n\n*Metadata*: \n\n${JSON.stringify(
                    req.query,
                )}`,
                type: "error",
            });
            return res.status(500).json({
                message: "Internal Server Error",
            });
        }
    } else if (req.method === "POST") {
        // POST /api/teams/:teamId/allow-list-groups
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(401).end("Unauthorized");
        }

        const { teamId } = req.query as { teamId: string };
        const { name, allowList } = req.body as {
            name: string;
            allowList: string[];
        };

        if (!name || !allowList || !Array.isArray(allowList)) {
            return res.status(400).json({
                error: "Missing required fields: name and allowList",
            });
        }

        try {
            const team = await prisma.team.findUnique({
                where: {
                    id: teamId,
                    users: {
                        some: {
                            userId: (session.user as any).id,
                        },
                    },
                },
            });

            if (!team) {
                return res.status(403).json({ error: "Unauthorized" });
            }

            // Create the allow list group
            const allowListGroup = await prisma.allowListGroup.create({
                data: {
                    name,
                    allowList,
                    teamId,
                },
                include: {
                    _count: {
                        select: {
                            links: true,
                        },
                    },
                },
            });

            return res.status(201).json(allowListGroup);
        } catch (error) {
            if ((error as any).code === "P2002") {
                return res.status(400).json({
                    error: "An allow list group with this name already exists",
                });
            }

            log({
                message: `Failed to create allow list group for team ${teamId}. \n\n Error: ${error} \n\n*Metadata*: \n\n${JSON.stringify(req.body)}`,
                type: "error",
            });
            return res.status(500).json({
                message: "Internal Server Error",
            });
        }
    } else {
        // We only allow GET and POST requests
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
} 