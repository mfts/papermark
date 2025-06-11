import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method !== "POST") {
        return res.status(405).end("Method Not Allowed");
    }

    const session = await getServerSession(req, res, authOptions);
    if (!session) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { key } = req.body as { key: string };

    if (!key) {
        return res.status(400).json({ message: "Key is required" });
    }

    try {
        const response = await fetch(
            `${process.env.NEXTAUTH_URL}/api/file/s3/get-presigned-get-url`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
                },
                body: JSON.stringify({ key: key }),
            },
        );

        if (!response.ok) {
            const error = await response.json();
            return res.status(response.status).json(error);
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error("Proxy error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
