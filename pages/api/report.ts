import { redis } from "@/lib/redis";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

const bodyValidation = z.object({
    linkId: z.string(),
    documentId: z.string(),
    viewId: z.string(),
    abuseType: z.number().int().min(1).max(6)
});

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const {
        linkId,
        documentId,
        viewId,
        abuseType,
    } = req.body as {
        linkId: string;
        documentId: string;
        viewId: string;
        abuseType: number;
    };
    const result = bodyValidation.safeParse(req.body);
    if (!result.success) {
        return res
            .status(400)
            .json({ error: `Invalid body: ${result.error.message}` });
    }

    try {
        // Create a unique Redis key to track reports for the documentId and linkId
        const reportKey = `report:${documentId}:${linkId}`;

        // Check if the viewId has already reported for this documentId and linkId
        const hasReported = await redis.sismember(reportKey, viewId);
        if (hasReported) {
            return res.status(400).json({
                status: "error",
                message: "Viewer has already reported this document and link",
            });
        }

        // Add the viewId to the Redis set for this documentId and linkId
        await redis.sadd(reportKey, viewId);

        // Increment the report count for the documentId and linkId
        const updatedCount = await redis.hincrby(
            "reportCounts",
            `${documentId}:${linkId}`,
            1
        );

        // Store the abuse type report under a Redis hash for future analysis
        await redis.hset(
            `report:${documentId}:${linkId}:details`,
            {
                [viewId]: abuseType // Store the abuseType as a number for this viewId
            }
        );


        return res.status(200).json({
            status: "success",
            message: "Report submitted successfully",
            reportCount: updatedCount,
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            status: "error",
            message: (err as Error).message,
        });
    }
}
