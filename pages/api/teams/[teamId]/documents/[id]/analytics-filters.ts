import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../../../../auth/[...nextauth]";

export default async function handle(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method === "GET") {
        // GET /api/teams/:teamId/documents/:id/analytics-filters
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(401).end("Unauthorized");
        }

        const { teamId, id: docId, linkIds } = req.query as {
            teamId: string;
            id: string;
            linkIds?: string;
        };

        const userId = (session.user as CustomUser).id;

        try {
            const viewQuery: {
                where: {
                    documentId: string;
                    isArchived: boolean;
                    linkId?: { in: string[] };
                };
                select: {
                    linkId: true;
                    viewerEmail: true;
                    viewerId: true;
                };
            } = {
                where: {
                    documentId: docId,
                    isArchived: false,
                },
                select: {
                    linkId: true,
                    viewerEmail: true,
                    viewerId: true,
                },
            };

            if (linkIds) {
                viewQuery.where.linkId = { in: linkIds.split(",") };
            }

            const links = await prisma.link.findMany({
                where: { documentId: docId },
                select: { id: true, name: true },
            });

            const availableLinks = links.map((link) => ({
                id: link.id,
                name: link.name || `Link #${link.id.slice(-5)}`,
            }));

            const views = await prisma.view.findMany(viewQuery);

            const viewerEmailsSet = new Set<string>();
            const viewersMap = new Map<string, { email: string; viewerId?: string }>();

            views.forEach((view) => {
                if (view.viewerEmail && !viewerEmailsSet.has(view.viewerEmail)) {
                    viewerEmailsSet.add(view.viewerEmail);
                    viewersMap.set(view.viewerEmail, {
                        email: view.viewerEmail,
                        viewerId: view.viewerId || undefined,
                    });
                }
            });

            const availableViewers = Array.from(viewersMap.values()).sort((a, b) =>
                a.email.localeCompare(b.email)
            );

            return res.status(200).json({
                availableLinks,
                availableViewers,
            });
        } catch (error) {
            errorhandler(error, res);
        }
    } else {
        // We only allow GET requests
        res.setHeader("Allow", ["GET"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
} 