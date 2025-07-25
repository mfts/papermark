import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { View } from "@prisma/client";

interface LinkAnalyticsResponse {
    views: View[];
    totalViews: number;
}

export default async function handle(
    req: NextApiRequest,
    res: NextApiResponse<LinkAnalyticsResponse | { message: string; error?: string }>
) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const session = await getServerSession(req, res, authOptions);
        const user = session?.user as CustomUser;

        if (!user?.id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { teamId, id: documentId, excludeTeamMembers } = req.query as {
            teamId: string;
            id: string;
            excludeTeamMembers?: string;
        };

        // Step 1: Check document access and fetch data
        const document = await prisma.document.findFirst({
            where: {
                id: documentId,
                teamId,
                team: {
                    users: {
                        some: {
                            userId: user.id,
                        },
                    },
                },
            },
            include: {
                views: true,
                versions: {
                    where: { isPrimary: true },
                    select: { type: true },
                },
            },
        });

        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        // Step 2: Ensure it's a link document
        if (document.versions[0]?.type !== "link") {
            return res.status(400).json({ message: "Not a link document" });
        }

        const allViews = document.views ?? [];
        if (allViews.length === 0) {
            return res.status(200).json({ views: [], totalViews: 0 });
        }

        let excludedEmails = new Set<string>();

        if (excludeTeamMembers) {
            const teamUsers = await prisma.user.findMany({
                where: {
                    teams: { some: { teamId } },
                },
                select: { email: true },
            });

            excludedEmails = new Set(teamUsers.map((u) => u.email).filter((e): e is string => !!e));
        }

        const filteredViews = allViews.filter((view) => {
            const isArchived = view.isArchived;
            const isInternal = excludedEmails.has(view.viewerEmail || "");
            return !isArchived && !(excludeTeamMembers && isInternal);
        });

        return res.status(200).json({
            views: filteredViews,
            totalViews: filteredViews.length,
        });

    } catch (error) {
        console.error("Link analytics error:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
        });

        return res.status(500).json({
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}
