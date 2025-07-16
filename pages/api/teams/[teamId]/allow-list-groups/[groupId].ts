import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";

export default async function handle(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method === "GET") {
        // GET /api/teams/:teamId/allow-list-groups/:groupId
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(401).end("Unauthorized");
        }

        const { teamId, groupId } = req.query as { teamId: string; groupId: string };

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

            const allowListGroup = await prisma.allowListGroup.findUnique({
                where: {
                    id: groupId,
                    teamId,
                },
                include: {
                    links: {
                        select: {
                            id: true,
                            name: true,
                            linkType: true,
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
                        },
                    },
                    _count: {
                        select: {
                            links: true,
                        },
                    },
                },
            });

            if (!allowListGroup) {
                return res.status(404).json({ error: "Allow list group not found" });
            }

            return res.status(200).json(allowListGroup);
        } catch (error) {
            log({
                message: `Failed to get allow list group ${groupId} for team ${teamId}. \n\n Error: ${error}`,
                type: "error",
            });
            return res.status(500).json({
                message: "Internal Server Error",
            });
        }
    } else if (req.method === "PUT") {
        // PUT /api/teams/:teamId/allow-list-groups/:groupId
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(401).end("Unauthorized");
        }

        const { teamId, groupId } = req.query as { teamId: string; groupId: string };
        const { name, allowList } = req.body as {
            name?: string;
            allowList?: string[];
        };

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

            // Update the allow list group
            const allowListGroup = await prisma.allowListGroup.update({
                where: {
                    id: groupId,
                    teamId,
                },
                data: {
                    ...(name && { name }),
                    ...(allowList && { allowList }),
                },
                include: {
                    _count: {
                        select: {
                            links: true,
                        },
                    },
                },
            });

            return res.status(200).json(allowListGroup);
        } catch (error) {
            if ((error as any).code === "P2002") {
                return res.status(400).json({
                    error: "An allow list group with this name already exists",
                });
            }

            if ((error as any).code === "P2025") {
                return res.status(404).json({ error: "Allow list group not found" });
            }

            log({
                message: `Failed to update allow list group ${groupId} for team ${teamId}. \n\n Error: ${error} \n\n*Metadata*: \n\n${JSON.stringify(req.body)}`,
                type: "error",
            });
            return res.status(500).json({
                message: "Internal Server Error",
            });
        }
    } else if (req.method === "DELETE") {
        // DELETE /api/teams/:teamId/allow-list-groups/:groupId
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(401).end("Unauthorized");
        }

        const { teamId, groupId } = req.query as { teamId: string; groupId: string };

        try {
            // only for deletion check if user is admin or manager
            const team = await prisma.team.findUnique({
                where: {
                    id: teamId,
                    users: {
                        some: {
                            userId: (session.user as any).id,
                            role: {
                                in: ["ADMIN", "MANAGER"],
                            },
                        },
                    },
                },
            });

            if (!team) {
                return res.status(403).json({ error: "Unauthorized" });
            }

            await prisma.allowListGroup.delete({
                where: {
                    id: groupId,
                    teamId,
                },
            });

            return res.status(200).json({ message: "Allow list group deleted successfully" });
        } catch (error) {
            if ((error as any).code === "P2025") {
                return res.status(404).json({ error: "Allow list group not found" });
            }

            log({
                message: `Failed to delete allow list group ${groupId} for team ${teamId}. \n\n Error: ${error}`,
                type: "error",
            });
            return res.status(500).json({
                message: "Internal Server Error",
            });
        }
    } else {
        // We only allow GET, PUT, and DELETE requests
        res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
} 