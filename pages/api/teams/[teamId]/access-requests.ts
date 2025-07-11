import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { errorhandler } from "@/lib/errorHandler";
import { AccessRequestStatus } from "@prisma/client";
import { sendAccessRequestResponse } from "@/lib/emails/send-access-request-response";
import { waitUntil } from "@vercel/functions";
import { CustomUser } from "@/lib/types";

export default async function handle(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method === "GET") {
        // GET /api/teams/[teamId]/access-requests
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(401).end("Unauthorized");
        }

        const { teamId } = req.query as { teamId: string };

        try {
            const team = await prisma.team.findFirst({
                where: {
                    id: teamId,
                    users: {
                        some: {
                            userId: (session.user as CustomUser).id,
                        },
                    },
                },
                select: { id: true },
            });

            if (!team) {
                return res.status(403).json({ error: "Forbidden" });
            }

            const { status, page = "1", limit = "10" } = req.query as {
                status?: AccessRequestStatus;
                page?: string;
                limit?: string;
            };

            const pageNum = parseInt(page as string);
            const limitNum = parseInt(limit as string);
            const skip = (pageNum - 1) * limitNum;

            const where = {
                teamId,
                ...(status && { status }),
            };

            const [accessRequests, totalCount] = await Promise.all([
                prisma.accessRequest.findMany({
                    where,
                    include: {
                        link: {
                            select: {
                                id: true,
                                name: true,
                                linkType: true,
                                allowList: true,
                                denyList: true,
                                document: {
                                    select: {
                                        name: true,
                                    },
                                },
                                dataroom: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                        approver: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: {
                        requestedAt: "desc",
                    },
                    skip,
                    take: limitNum,
                }),
                prisma.accessRequest.count({ where }),
            ]);

            const totalPages = Math.ceil(totalCount / limitNum);

            return res.status(200).json({
                accessRequests,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalCount,
                    limit: limitNum,
                },
            });
        } catch (error) {
            console.error("Request error", error);
            return errorhandler(error, res);
        }
    } else if (req.method === "PUT") {
        // PUT /api/teams/[teamId]/access-requests
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(401).end("Unauthorized");
        }

        const { teamId } = req.query as { teamId: string };
        const { requestId, action } = req.body as {
            requestId: string;
            action: "approve" | "deny";
        };

        try {
            // Check if user is part of the team and has admin/manager role
            const team = await prisma.team.findFirst({
                where: {
                    id: teamId,
                    users: {
                        some: {
                            userId: (session.user as CustomUser).id,
                            role: {
                                in: ["ADMIN", "MANAGER"],
                            },
                        },
                    },
                },
                select: { id: true },
            });

            if (!team) {
                return res.status(403).json({ error: "Forbidden" });
            }

            // Check if the access request exists and belongs to this team
            const accessRequest = await prisma.accessRequest.findFirst({
                where: {
                    id: requestId,
                    teamId,
                    status: "PENDING",
                },
                include: {
                    link: {
                        select: {
                            allowList: true,
                            denyList: true,
                        },
                    },
                },
            });

            if (!accessRequest) {
                return res.status(404).json({ error: "Access request not found" });
            }

            const newStatus: AccessRequestStatus = action === "approve" ? "APPROVED" : "DENIED";

            // Update the access request
            const updatedRequest = await prisma.accessRequest.update({
                where: { id: requestId },
                data: {
                    status: newStatus,
                    respondedAt: new Date(),
                    respondedBy: (session.user as CustomUser).id,
                },
                include: {
                    link: {
                        select: {
                            id: true,
                            name: true,
                            linkType: true,
                            domainId: true,
                            domainSlug: true,
                            slug: true,
                            document: {
                                select: {
                                    name: true,
                                },
                            },
                            dataroom: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                    approver: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });

            let linkUpdates: any = {};
            let notificationMessage = "";

            // Handle approval or denial logic
            if (action === "approve") {
                const currentAllowList = accessRequest.link.allowList || [];
                const currentDenyList = accessRequest.link.denyList || [];

                // Check if email is in deny list
                const isInDenyList = currentDenyList.includes(accessRequest.email);

                if (isInDenyList) {
                    // Remove from deny list and add to allow list
                    linkUpdates.denyList = currentDenyList.filter(email => email !== accessRequest.email);
                    linkUpdates.allowList = [...currentAllowList, accessRequest.email];
                    notificationMessage = "Email removed from block list and added to allow list.";
                } else if (!currentAllowList.includes(accessRequest.email)) {
                    // Just add to allow list
                    linkUpdates.allowList = [...currentAllowList, accessRequest.email];
                }

                // Update the link if there are changes
                if (Object.keys(linkUpdates).length > 0) {
                    await prisma.link.update({
                        where: { id: accessRequest.linkId },
                        data: linkUpdates,
                    });
                }
            }

            // Send notification email to requester only if approved
            if (action === "approve") {
                const linkUrl = updatedRequest.link.domainId
                    ? `https://${updatedRequest.link.domainSlug}/${updatedRequest.link.slug}`
                    : `${process.env.NEXT_PUBLIC_MARKETING_URL}/view/${updatedRequest.link.id}`;

                // Send email with proper error handling
                waitUntil(
                    sendAccessRequestResponse({
                        to: accessRequest.email,
                        requesterEmail: accessRequest.email,
                        linkUrl,
                    }).catch((error) => {
                        console.error("Failed to send access request approval email:", error);
                    })
                );
            }

            return res.status(200).json({
                ...updatedRequest,
                notificationMessage,
            });
        } catch (error) {
            console.error("Request error", error);
            return errorhandler(error, res);
        }
    } else if (req.method === "DELETE") {
        // DELETE /api/teams/[teamId]/access-requests
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(401).end("Unauthorized");
        }

        const { teamId } = req.query as { teamId: string };
        const { requestId } = req.body as { requestId: string };

        try {
            // Check if user is part of the team and has admin/manager role
            const team = await prisma.team.findFirst({
                where: {
                    id: teamId,
                    users: {
                        some: {
                            userId: (session.user as CustomUser).id,
                            role: {
                                in: ["ADMIN", "MANAGER"],
                            },
                        },
                    },
                },
                select: { id: true },
            });

            if (!team) {
                return res.status(403).json({ error: "Forbidden" });
            }

            // Delete the access request
            await prisma.accessRequest.delete({
                where: {
                    id: requestId,
                    teamId,
                },
            });

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error("Request error", error);
            return errorhandler(error, res);
        }
    } else {
        res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
} 