import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const session = await getServerSession(req, res, authOptions);
    if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const { teamId } = req.query as { teamId: string };
    const user = session.user as CustomUser;

    try {
        const userTeam = await prisma.userTeam.findUnique({
            where: {
                userId_teamId: {
                    userId: user.id,
                    teamId: teamId,
                },
            },
            select: {
                tabsLastUpdatedAt: true,
            },
        });

        if (!userTeam) {
            return res.status(403).json({ error: "Access denied" });
        }

        const tabs = await prisma.documentTab.findMany({
            where: {
                userId: user.id,
                teamId: teamId,
            },
            select: {
                documentId: true,
                order: true,
            },
            orderBy: {
                order: "asc",
            },
        });

        // Create a SHA-256 hash of the tabs for quick comparison (same as client)
        const tabsString = tabs.map(t => `${t.documentId}:${t.order}`).join("|");
        const tabsHash = crypto.createHash('sha256').update(tabsString).digest('hex');

        return res.status(200).json({
            lastUpdatedAt: userTeam.tabsLastUpdatedAt?.toISOString() || null,
            tabsHash,
            tabsCount: tabs.length,
        });
    } catch (error) {
        console.error("Error in document-tabs-sync:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
} 