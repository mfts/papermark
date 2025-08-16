import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";
import { CustomUser } from "@/lib/types";

export default async function handle(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method !== "GET") {
        res.setHeader("Allow", ["GET"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const session = await getServerSession(req, res, authOptions);
    if (!session) {
        return res.status(401).end("Unauthorized");
    }

    const { teamId, id: documentId, page = "1", limit = "10" } = req.query as {
        teamId: string;
        id: string;
        page?: string;
        limit?: string;
    };

    const userId = (session.user as CustomUser).id;

    const pageNumber = parseInt(page, 10);
    const pageSize = Math.min(parseInt(limit, 10), 50);
    const skip = (pageNumber - 1) * pageSize;

    try {
        const { team, document } = await getTeamWithUsersAndDocument({
            teamId,
            userId,
            docId: documentId,
            checkOwner: false,
            options: {
                select: {
                    id: true,
                    name: true,
                    versions: {
                        select: {
                            id: true,
                            versionNumber: true,
                            isPrimary: true,
                            hasPages: true,
                            type: true,
                            contentType: true,
                            fileSize: true,
                            numPages: true,
                            createdAt: true,
                            updatedAt: true,
                            _count: {
                                select: {
                                    pages: true,
                                },
                            },
                        },
                        orderBy: {
                            versionNumber: "desc",
                        },
                        skip,
                        take: pageSize,
                    },
                    views: true,
                },
            },
        });

        if (!team) {
            return res.status(404).json({
                message: "Team not found",
            });
        };
        const totalVersions = await prisma.documentVersion.count({
            where: {
                documentId,
            },
        });

        const userTeam = await prisma.userTeam.findUnique({
            where: {
                userId_teamId: {
                    userId,
                    teamId,
                },
            },
            select: { role: true },
        });

        const canManageVersions = userTeam && (userTeam.role === "ADMIN" || userTeam.role === "MANAGER");

        const versionsWithMetadata = document?.versions?.map(version => ({
            ...version,
            canDelete: canManageVersions && !version.isPrimary && totalVersions > 1,
            canPromote: canManageVersions && !version.isPrimary,
        }));

        const totalPages = Math.ceil(totalVersions / pageSize);

        return res.status(200).json({
            documentId,
            documentName: document?.name,
            versions: versionsWithMetadata,
            canManageVersions,
            views: document?.views,
            pagination: {
                currentPage: pageNumber,
                pageSize,
                totalItems: totalVersions,
                totalPages,
                hasNextPage: pageNumber < totalPages,
                hasPreviousPage: pageNumber > 1,
            },
        });

    } catch (error) {
        console.error("Error fetching document versions:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: (error as Error).message,
        });
    }
} 