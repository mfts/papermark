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
        // GET /api/teams/:teamId/access-groups/:groupId/links
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(401).end("Unauthorized");
        }

        const { teamId, groupId } = req.query as {
            teamId: string;
            groupId: string;
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

            const accessGroup = await prisma.accessGroup.findUnique({
                where: {
                    id: groupId,
                    teamId: teamId,
                },
                select: {
                    id: true,
                    type: true,
                },
            });

            if (!accessGroup) {
                return res.status(404).json({ error: "Access group not found" });
            }

            const whereClause = accessGroup.type === "ALLOW"
                ? { allowAccessGroupId: groupId }
                : { blockAccessGroupId: groupId };

            const links = await prisma.link.findMany({
                where: {
                    ...whereClause,
                    document: {
                        teamId: teamId,
                    },
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    createdAt: true,
                    updatedAt: true,
                    document: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    dataroom: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    _count: {
                        select: {
                            views: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

            return res.status(200).json(links);
        } catch (error) {
            log({
                message: `Failed to get links for access group: _${groupId}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, groupId: ${groupId}, userId: ${userId}}\``,
                type: "error",
            });
            errorhandler(error, res);
        }
    } else {
        res.setHeader("Allow", ["GET"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
} 