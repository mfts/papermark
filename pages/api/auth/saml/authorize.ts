import { NextApiRequest, NextApiResponse } from "next";

import { jackson } from "@/lib/jackson";

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

    const { redirect_url } = await oauthController.authorize(
      req.query as any,
    );

    if (!redirect_url) {
      return res.status(400).json({ error: "No redirect URL returned" });
    }

    return res.redirect(302, redirect_url);
  } catch (error: any) {
    console.error("[SAML] Authorize error:", error);
    return res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
}
