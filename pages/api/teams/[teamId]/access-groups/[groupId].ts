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
        // GET /api/teams/:teamId/access-groups/:groupId
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
                include: {
                    _count: {
                        select: {
                            allowLinks: true,
                            blockLinks: true,
                        },
                    },
                },
            });

            if (!accessGroup) {
                return res.status(404).json({ error: "Access group not found" });
            }

            return res.status(200).json(accessGroup);
        } catch (error) {
            log({
                message: `Failed to get access group for team: _${teamId}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, groupId: ${groupId}, userId: ${userId}}\``,
                type: "error",
            });
            errorhandler(error, res);
        }
    } else if (req.method === "PUT") {
        // PUT /api/teams/:teamId/access-groups/:groupId
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            res.status(401).end("Unauthorized");
            return;
        }

        const userId = (session.user as CustomUser).id;
        const { teamId, groupId } = req.query as {
            teamId: string;
            groupId: string;
        };

        const { name, emailList } = req.body as {
            name: string;
            emailList: string[];
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

            // Check if the group exists and belongs to this team
            const existingGroup = await prisma.accessGroup.findUnique({
                where: {
                    id: groupId,
                    teamId: teamId,
                },
            });

            if (!existingGroup) {
                return res.status(404).json({ error: "Access group not found" });
            }

            // Validate required fields
            if (!name || !name.trim()) {
                return res.status(400).json({ error: "Group name is required" });
            }

            if (!emailList || emailList.length === 0) {
                return res.status(400).json({ error: "At least one email or domain is required" });
            }

            // Check if another group with the same name exists (excluding the current group)
            const duplicateGroup = await prisma.accessGroup.findFirst({
                where: {
                    teamId: teamId,
                    name: name.trim(),
                    type: existingGroup.type,
                    id: {
                        not: groupId,
                    },
                },
            });

            if (duplicateGroup) {
                return res.status(400).json({ error: "A group with this name already exists" });
            }

            const updatedGroup = await prisma.accessGroup.update({
                where: {
                    id: groupId,
                },
                data: {
                    name: name.trim(),
                    emailList: emailList,
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

            res.status(200).json(updatedGroup);
        } catch (error) {
            log({
                message: `Failed to update access group for team: _${teamId}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, groupId: ${groupId}, userId: ${userId}}\``,
                type: "error",
            });
            errorhandler(error, res);
        }
    } else if (req.method === "DELETE") {
        // DELETE /api/teams/:teamId/access-groups/:groupId
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            res.status(401).end("Unauthorized");
            return;
        }

        const userId = (session.user as CustomUser).id;
        const { teamId, groupId } = req.query as {
            teamId: string;
            groupId: string;
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

            const existingGroup = await prisma.accessGroup.findUnique({
                where: {
                    id: groupId,
                    teamId: teamId,
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

            if (!existingGroup) {
                return res.status(404).json({ error: "Access group not found" });
            }

            // Get link count for logging purposes
            const linkCount = existingGroup.type === "ALLOW"
                ? existingGroup._count.allowLinks
                : existingGroup._count.blockLinks;

            // Delete the access group - this will automatically set the foreign key references to NULL
            // due to the onDelete: SetNull constraint in the database schema
            await prisma.accessGroup.delete({
                where: {
                    id: groupId,
                },
            });

            // Log the deletion for audit purposes
            if (linkCount > 0) {
                log({
                    message: `Access group "${existingGroup.name}" deleted and automatically removed from ${linkCount} link${linkCount > 1 ? 's' : ''}. Team: ${teamId}, User: ${userId}`,
                    type: "info",
                });
            }

            const successMessage = linkCount > 0
                ? `Access group deleted successfully. Automatically removed from ${linkCount} link${linkCount > 1 ? 's' : ''}.`
                : "Access group deleted successfully.";

            res.status(200).json({ message: successMessage });
        } catch (error) {
            log({
                message: `Failed to delete access group for team: _${teamId}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, groupId: ${groupId}, userId: ${userId}}\``,
                type: "error",
            });
            errorhandler(error, res);
        }
    } else {
        // We only allow GET, PUT, DELETE requests
        res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
} 