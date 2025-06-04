import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../../../auth/[...nextauth]";

export default async function handle(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
        return res.status(401).end("Unauthorized");
    }

    const { teamId, id } = req.query as { teamId: string; id: string };

    try {
        const team = await prisma.team.findUnique({
            where: {
                id: teamId,
            },
            select: {
                id: true,
                users: { select: { userId: true } },
            },
        });

        // check that the user is member of the team, otherwise return 403
        const teamUsers = team?.users;
        const isUserPartOfTeam = teamUsers?.some(
            (user) => user.userId === (session.user as CustomUser).id,
        );
        if (!isUserPartOfTeam) {
            return res.status(403).end("Unauthorized to access this team");
        }

        if (req.method === "DELETE") {
            // First verify the pin belongs to the team
            const pin = await prisma.pin.findUnique({
                where: { id, teamId },
            });

            if (!pin) {
                return res.status(404).json({ error: "Pin not found" });
            }

            // Then delete the pin
            await prisma.pin.delete({
                where: { id, teamId },
            });
            return res.status(204).end();
        } else {
            res.setHeader("Allow", ["DELETE"]);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        errorhandler(error, res);
    }
} 