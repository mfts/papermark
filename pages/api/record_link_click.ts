import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";

const bodyValidation = z.object({
    viewId: z.string(),
    linkId: z.string(),
});

export default async function handle(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method !== "POST") {
        res.status(405).json({ message: "Method Not Allowed" });
        return;
    }

    const { viewId, linkId } = req.body as {
        viewId: string;
        linkId: string;
    };

    const result = bodyValidation.safeParse({ viewId, linkId });
    if (!result.success) {
        return res.status(400).json({ error: `Invalid body: ${result.error.message}` });
    }

    try {
        const link = await prisma.link.findUnique({ where: { id: linkId } });
        if (!link) return res.status(404).json({ message: "Link not found" });

        const view = await prisma.view.findUnique({
            where: { id: viewId },
        });
        if (!view || view.linkId !== linkId) {
            return res.status(404).json({ message: "View not found" });
        }

        const updated = await prisma.view.update({
            where: { id: viewId },
            data: { redirectAt: new Date().toISOString() },
        });

        res.status(200).json({ message: "Link click recorded", view: updated });
    } catch (error) {
        log({
            message: `Failed to record link click for ${linkId}.\n\n ${error}`,
            type: "error",
            mention: true,
        });
        res.status(500).json({ message: (error as Error).message });
    }
}