import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { getVideoViewUserAgent } from "@/lib/tinybird";
import { CustomUser } from "@/lib/types";

export default async function handle(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method === "GET") {
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(401).end("Unauthorized");
        }

        const {
            teamId,
            id: docId,
            viewId,
        } = req.query as {
            teamId: string;
            id: string;
            viewId: string;
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
                    plan: true,
                },
            });

            if (!team) {
                return res.status(401).end("Unauthorized");
            }

            if (team.plan.includes("free")) {
                return res.status(403).end("Forbidden");
            }

            const userAgent = await getVideoViewUserAgent({
                viewId: viewId,
                since: 0,
            });

            const userAgentData = userAgent.data[0];

            if (!userAgentData) {
                return res.status(404).end("No video user agent data found");
            }

            if (team.plan.includes("business") || team.plan.includes("datarooms")) {
                return res.status(200).json(userAgentData);
            } else {
                const { country, city, ...remainingResponse } = userAgentData;
                return res.status(200).json(remainingResponse);
            }
        } catch (error) {
            errorhandler(error, res);
        }
    } else {
        res.setHeader("Allow", ["GET"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
} 