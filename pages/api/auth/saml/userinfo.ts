import { NextApiRequest, NextApiResponse } from "next";

import jackson from "@/lib/jackson";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { oauthController } = await jackson();

    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userInfo = await oauthController.userInfo(token);
    return res.status(200).json(userInfo);
  } catch (error: any) {
    console.error("[SAML] UserInfo error:", error);
    return res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
}
