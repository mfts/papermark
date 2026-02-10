import { NextApiRequest, NextApiResponse } from "next";

import jackson from "@/lib/jackson";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { oauthController } = await jackson();

    const response = await oauthController.token(req.body);
    return res.status(200).json(response);
  } catch (error: any) {
    console.error("[SAML] Token error:", error);
    return res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
}
