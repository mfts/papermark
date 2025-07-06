import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

// Template dataroom IDs from Papermark Templates account
const TEMPLATE_DATAROOM_IDS = [
    "cmclsvtli0001jp04xhvtsbc8",
    "cmcnpybt1000sjx04zz2p34kn",
];

export default async function handle(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method === "GET") {
        // GET /api/teams/:teamId/datarooms/templates
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(401).end("Unauthorized");
        }

        const { teamId } = req.query as { teamId: string };
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
            });

            if (!team) {
                return res.status(401).end("Unauthorized");
            }

            const templates = await prisma.dataroom.findMany({
                where: {
                    id: {
                        in: TEMPLATE_DATAROOM_IDS,
                    },
                },
                include: {
                    brand: {
                        select: {
                            banner: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "asc",
                },
            });

            return res.status(200).json(templates);
        } catch (error) {
            console.error("Request error", error);
            return res.status(500).json({ error: "Error fetching templates" });
        }
    } else {
        // We only allow GET requests
        res.setHeader("Allow", ["GET"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
} 