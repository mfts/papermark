import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { Session } from "next-auth";

import { authOptions } from "../../auth/[...nextauth]";
import { errorhandler } from "@/lib/errorHandler";

interface CustomSession extends Session {
    user: {
        id: string;
        name?: string | null;
    };
}

export default async function handle(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "PATCH") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const session = await getServerSession(req, res, authOptions) as CustomSession | null;
        if (!session?.user?.id) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { teamId } = req.query;
        const { enableExcelAdvancedMode } = req.body;

        // Verify user is part of the team
        const team = await prisma.team.findFirst({
            where: {
                id: teamId as string,
                users: {
                    some: {
                        userId: session.user.id,
                    },
                },
            },
        });

        if (!team) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Update team limits
        const updatedTeam = await prisma.team.update({
            where: {
                id: teamId as string,
            },
            data: {
                enableExcelAdvancedMode,
            },
        });

        return res.status(200).json(updatedTeam);
    } catch (error) {
        errorhandler(error, res);
    }
} 