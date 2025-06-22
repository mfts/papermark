import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";

export default async function handle(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method === "GET") {
        // GET /api/teams/:teamId/access-groups?type=ALLOW|BLOCK
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(401).end("Unauthorized");
        }

        const { teamId, type, page, limit } = req.query as {
            teamId: string;
            type?: "ALLOW" | "BLOCK";
            page?: string;
            limit?: string;
        };
        const userId = (session.user as CustomUser).id;

        try {
            const team = await prisma.team.findUnique({
                where: {
                    id: teamId,
                    users: {
                        some: {
                            userId: userId,
                        },
                    },
                },
                select: {
                    id: true,
                },
            });

            if (!team) {
                return res.status(403).end("Unauthorized to access this team");
            }

            const whereClause: any = {
                teamId: teamId,
            };

            if (type) {
                whereClause.type = type;
            }

            const pageNumber = parseInt(page || "1", 10);
            const pageSize = parseInt(limit || "10", 10);
            const skip = (pageNumber - 1) * pageSize;

            const totalCount = await prisma.accessGroup.count({
                where: whereClause,
            });

            const accessGroups = await prisma.accessGroup.findMany({
                where: whereClause,
                include: {
                    _count: {
                        select: {
                            allowLinks: true,
                            blockLinks: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
                skip: skip,
                take: pageSize,
            });

            const totalPages = Math.ceil(totalCount / pageSize);

            return res.status(200).json({
                groups: accessGroups,
                pagination: {
                    page: pageNumber,
                    limit: pageSize,
                    total: totalCount,
                    totalPages: totalPages,
                    hasNext: pageNumber < totalPages,
                    hasPrev: pageNumber > 1,
                },
            });
        } catch (error) {
            log({
                message: `Failed to get access groups for team: _${teamId}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, userId: ${userId}, type: ${type}}\``,
                type: "error",
            });
            errorhandler(error, res);
        }
    } else if (req.method === "POST") {
        // POST /api/teams/:teamId/access-groups
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            res.status(401).end("Unauthorized");
            return;
        }

        const userId = (session.user as CustomUser).id;
        const { teamId } = req.query as {
            teamId: string;
        };

        const { name, emailList, type } = req.body as {
            name: string;
            emailList: string[];
            type: "ALLOW" | "BLOCK";
        };

        try {
            // Check if the user is part of the team
            const team = await prisma.team.findUnique({
                where: {
                    id: teamId,
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

            // Validate required fields
            if (!name || !name.trim()) {
                return res.status(400).json({ error: "Group name is required" });
            }

            if (!emailList || emailList.length === 0) {
                return res.status(400).json({ error: "At least one email or domain is required" });
            }

            if (!type || !["ALLOW", "BLOCK"].includes(type)) {
                return res.status(400).json({ error: "Valid type (ALLOW or BLOCK) is required" });
            }

            // Check if group name already exists for this team and type
            const existingGroup = await prisma.accessGroup.findFirst({
                where: {
                    teamId: teamId,
                    name: name.trim(),
                    type: type,
                },
            });

            if (existingGroup) {
                return res.status(400).json({ error: "A group with this name already exists" });
            }

            const accessGroup = await prisma.accessGroup.create({
                data: {
                    name: name.trim(),
                    emailList: emailList,
                    type: type,
                    teamId,
                },
                include: {
                    _count: {
                        select: {
                            allowLinks: true,
                            blockLinks: true,
                        },
                    },
                },
            });

            res.status(201).json(accessGroup);
        } catch (error) {
            log({
                message: `Failed to create access group for team: _${teamId}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, userId: ${userId}}\``,
                type: "error",
            });
            errorhandler(error, res);
        }
    } else {
        // We only allow GET, POST requests
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
} 