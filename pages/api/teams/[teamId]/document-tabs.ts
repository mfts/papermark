import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateTabsSchema = z.object({
    tabs: z.array(
        z.object({
            id: z.string(),
            title: z.string(),
            isTemporary: z.boolean().optional(),
        })
    ),
});

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const { teamId } = req.query as { teamId: string };
    const user = session.user as CustomUser;

    const userTeam = await prisma.userTeam.findUnique({
        where: {
            userId_teamId: {
                userId: user.id,
                teamId: teamId,
            },
        },
    });

    if (!userTeam) {
        return res.status(403).json({ error: "Access denied" });
    }

    if (req.method === "GET") {
        try {
            const dbTabs = await prisma.documentTab.findMany({
                where: {
                    userId: user.id,
                    teamId: teamId,
                },
                include: {
                    document: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: {
                    order: "asc",
                },
            });

            const tabs = dbTabs.map((tab) => ({
                id: tab.documentId,
                title: tab.document.name || `Document ${tab.documentId}`,
                isTemporary: false,
            }));

            return res.status(200).json({ tabs });
        } catch (error) {
            console.error("Error fetching tabs:", error);
            return res.status(500).json({ error: "Failed to fetch tabs" });
        }
    }

    if (req.method === "POST") {
        try {
            const body = updateTabsSchema.parse(req.body);

            const permanentTabs = body.tabs.filter(tab => !tab.isTemporary);

            const seenDocumentIds = new Set<string>();
            const uniquePermanentTabs = permanentTabs.filter(tab => {
                if (seenDocumentIds.has(tab.id)) {
                    return false;
                }
                seenDocumentIds.add(tab.id);
                return true;
            });

            await prisma.$transaction(async (tx) => {
                await tx.documentTab.deleteMany({
                    where: {
                        userId: user.id,
                        teamId: teamId,
                    },
                });

                if (uniquePermanentTabs.length > 0) {
                    await tx.documentTab.createMany({
                        data: uniquePermanentTabs.map((tab, index) => ({
                            documentId: tab.id,
                            userId: user.id,
                            teamId: teamId,
                            order: index,
                        })),
                    });
                }

                await tx.userTeam.update({
                    where: {
                        userId_teamId: {
                            userId: user.id,
                            teamId: teamId,
                        },
                    },
                    data: {
                        tabsLastUpdatedAt: new Date(),
                    },
                });
            });

            return res.status(200).json({
                success: true,
                message: `Updated ${uniquePermanentTabs.length} unique permanent tabs (from ${permanentTabs.length} total permanent tabs)`
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ error: "Invalid request body", details: error.errors });
            }

            console.error("Error updating tabs:", error);
            return res.status(500).json({ error: "Failed to update tabs" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
} 