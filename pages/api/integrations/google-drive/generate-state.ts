import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth";
import { CustomUser } from "@/lib/types";
import { generateChecksum } from "@/lib/utils/generate-checksum";

import { authOptions } from "../../auth/[...nextauth]";

export default async function handle(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method === "GET") {
        // GET /api/integrations/google-drive/generate-state
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            res.status(401).end("Unauthorized");
            throw new Error("Unauthorized");
        }
        const sessionUser = session.user as CustomUser;
        const stateBase = `${sessionUser.email}:${Date.now()}`;
        const checksum = generateChecksum(stateBase);
        const state = `${stateBase}::${checksum}`;

        return res.status(200).json({ state });
    } else {
        res.setHeader("Allow", ["GET"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
