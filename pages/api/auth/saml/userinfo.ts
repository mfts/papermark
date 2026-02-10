import { NextApiRequest, NextApiResponse } from "next";

import initJackson from "@/lib/jackson";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { oauthController } = await initJackson();

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userInfo = await oauthController.userInfo(token);
    return res.status(200).json(userInfo);
  } catch (error) {
    return res.status(401).json({
      error: (error as Error).message || "Invalid token.",
    });
  }
}
